import re
from datetime import datetime, timezone
from sqlalchemy import or_
from ..models import db, Post, PostLike, SearchHistory, User

STOP_WORDS = {
    'the', 'is', 'a', 'an', 'and', 'or', 'for', 'with', 'this', 'that', 'to', 'in',
    'on', 'of', 'by', 'from', 'at', 'about', 'as', 'into', 'like', 'through', 'after',
    'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under',
    'around', 'among', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their',
    'he', 'she', 'his', 'her', 'be', 'are', 'was', 'were', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will',
    'using', 'based', 'all', 'new', 'get', 'set'
}

DEFAULT_WEIGHTS = {
    'content_similarity': 0.35,
    'liked_topics': 0.25,
    'project_similarity': 0.15,
    'search_similarity': 0.10,
    'recency': 0.10,
    'popularity': 0.05
}

def normalize_and_tokenize(text):
    """Normalize text (lowercase, remove punctuation) and tokenize into non-stopwords."""
    if not text:
        return set()
    text = str(text).lower()
    words = re.findall(r'[a-z0-9+#]+', text)
    return {w for w in words if len(w) > 1 and w not in STOP_WORDS}


def jaccard_similarity(set1, set2):
    """Calculate Jaccard index between two token sets."""
    if not set1 or not set2:
        return 0.0
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    return (intersection / union) if union > 0 else 0.0


def overlap_score(subset, superset):
    """Calculate ratio of subset tokens found in superset."""
    if not subset or not superset:
        return 0.0
    intersection = len(subset & superset)
    return min(1.0, intersection / max(1, len(subset)))


def get_recency_score(created_at):
    """Compute decay-based recency score from 0.0 to 1.0."""
    if not created_at:
        return 0.2
    now = datetime.utcnow()
    age_seconds = (now - created_at).total_seconds()
    if age_seconds < 0:
        age_seconds = 0
    age_days = age_seconds / 86400.0
    
    if age_days <= 1.0:
        return 1.0
    elif age_days <= 3.0:
        return 0.8
    elif age_days <= 7.0:
        return 0.6
    elif age_days <= 14.0:
        return 0.4
    elif age_days <= 30.0:
        return 0.2
    else:
        return 0.1


def get_popularity_score(post):
    """Compute normalized popularity score based on likes and comments count."""
    likes_count = len(post.likes) if post.likes else 0
    comments_count = len(post.comments) if post.comments else 0
    raw_signal = likes_count * 1.0 + comments_count * 2.0
    return min(1.0, raw_signal / 15.0)


class RecommendationService:
    @staticmethod
    def record_search(username, query):
        """Record user search query for search-based recommendation signals."""
        if not username or not query or not query.strip():
            return None
        cleaned_query = query.strip()[:255]
        try:
            record = SearchHistory(username=username, query=cleaned_query)
            db.session.add(record)
            db.session.commit()
            return record
        except Exception:
            db.session.rollback()
            return None

    @staticmethod
    def get_user_interest_profile(user):
        """Derive positive signals, interests, and topic keywords from user's history."""
        liked_records = PostLike.query.filter_by(username=user.username).all()
        liked_post_ids = [l.post_id for l in liked_records]

        liked_posts = []
        if liked_post_ids:
            liked_posts = Post.query.filter(Post.id.in_(liked_post_ids)).all()

        liked_tokens = set()
        liked_categories = set()
        liked_tags = set()
        liked_project_tokens = set()

        for p in liked_posts:
            p_tokens = normalize_and_tokenize(f"{p.title} {p.description or ''}")
            liked_tokens |= p_tokens
            if p.category:
                liked_categories.add(p.category.lower())
            for t in (p.tags or []):
                liked_tags.add(t.lower())
                liked_tokens |= normalize_and_tokenize(t)
            if p.type == 'project':
                liked_project_tokens |= p_tokens

        # Search signals (recent searches)
        recent_searches = db.session.query(SearchHistory).filter_by(username=user.username)\
            .order_by(SearchHistory.created_at.desc())\
            .limit(15).all()
        search_tokens = set()
        for s in recent_searches:
            search_tokens |= normalize_and_tokenize(s.search_term)

        # Profile signals
        profile_tokens = set()
        if user.major:
            profile_tokens |= normalize_and_tokenize(user.major)
        if user.institution:
            profile_tokens |= normalize_and_tokenize(user.institution)
        if user.bio:
            profile_tokens |= normalize_and_tokenize(user.bio)
        for skill in (user.skills or []):
            profile_tokens |= normalize_and_tokenize(skill)

        return {
            'liked_post_ids': set(liked_post_ids),
            'liked_tokens': liked_tokens,
            'liked_categories': liked_categories,
            'liked_tags': liked_tags,
            'liked_project_tokens': liked_project_tokens,
            'search_tokens': search_tokens,
            'profile_tokens': profile_tokens,
            'has_interactions': bool(liked_post_ids or search_tokens or profile_tokens)
        }

    @staticmethod
    def generate_candidate_pool(user, interest_profile, limit=80):
        """
        Generate candidate posts from:
        - Group A: Posts similar to liked posts (tags/categories)
        - Group B: Posts matching user's profile interests / major / department
        - Group C: Posts related to searched topics
        - Group D: Active project posts
        - Group E: Recent posts
        - Group F: Popular posts
        """
        candidate_map = {}

        def add_candidates(posts):
            for p in posts:
                if p.id not in candidate_map:
                    candidate_map[p.id] = p

        # 1. Recent posts pool (Candidate Group E)
        recent_posts = Post.query.order_by(Post.created_at.desc()).limit(40).all()
        add_candidates(recent_posts)

        # 2. Project posts pool (Candidate Group D)
        project_posts = Post.query.filter_by(type='project').order_by(Post.created_at.desc()).limit(30).all()
        add_candidates(project_posts)

        # 3. Matching categories and tags (Candidate Group A)
        if interest_profile['liked_categories']:
            cat_list = list(interest_profile['liked_categories'])
            matched_cats = Post.query.filter(Post.category.in_(cat_list)).limit(25).all()
            add_candidates(matched_cats)

        # 4. Search terms matched posts (Candidate Group C)
        if interest_profile['search_tokens']:
            search_filters = []
            for token in list(interest_profile['search_tokens'])[:5]:
                search_filters.append(Post.title.ilike(f"%{token}%"))
                search_filters.append(Post.description.ilike(f"%{token}%"))
            if search_filters:
                search_matched = Post.query.filter(or_(*search_filters)).limit(25).all()
                add_candidates(search_matched)

        # 5. User department / major matching (Candidate Group B)
        if user and user.major:
            dept_posts = Post.query.filter(
                (Post.department.ilike(f"%{user.major}%")) |
                (Post.title.ilike(f"%{user.major}%"))
            ).limit(20).all()
            add_candidates(dept_posts)

        return list(candidate_map.values())

    @classmethod
    def score_and_rank_posts(cls, user, candidate_posts, interest_profile, weights=None, limit=20):
        """
        Score candidate posts using multi-signal weighted formula:
        recommendationScore =
            contentSimilarityScore * 0.35
            + likedTopicScore * 0.25
            + projectSimilarityScore * 0.15
            + searchSimilarityScore * 0.10
            + recencyScore * 0.10
            + popularityScore * 0.05
        """
        w = weights or DEFAULT_WEIGHTS
        scored_candidates = []

        is_cold_start = not interest_profile['has_interactions']

        for post in candidate_posts:
            # Exclude posts user should not see based on visibility
            if post.visibility and post.visibility != 'everyone':
                if user.role != 'admin':
                    if post.visibility == 'students' and user.role != 'student':
                        continue
                    if post.visibility == 'faculty' and user.role != 'admin':
                        continue

            post_tokens = normalize_and_tokenize(f"{post.title} {post.description or ''}")
            for tag in (post.tags or []):
                post_tokens |= normalize_and_tokenize(tag)

            if is_cold_start:
                # Cold start balanced scoring: recency (0.45), popularity (0.35), project boost (0.20)
                recency = get_recency_score(post.created_at)
                popularity = get_popularity_score(post)
                project_boost = 0.8 if post.type == 'project' else 0.4
                final_score = (recency * 0.45) + (popularity * 0.35) + (project_boost * 0.20)
                reason = "Trending on CampusHub" if popularity > 0.5 else "Recent campus update"
            else:
                # 1. Content similarity (overlap with liked tokens & profile tokens)
                target_user_tokens = interest_profile['liked_tokens'] | interest_profile['profile_tokens']
                content_sim = jaccard_similarity(post_tokens, target_user_tokens)

                # 2. Liked topic score (category & tags match)
                liked_topic = 0.0
                if post.category and post.category.lower() in interest_profile['liked_categories']:
                    liked_topic += 0.6
                tag_overlap = 0
                for t in (post.tags or []):
                    if t.lower() in interest_profile['liked_tags']:
                        tag_overlap += 1
                if tag_overlap > 0:
                    liked_topic += min(0.4, tag_overlap * 0.2)
                liked_topic = min(1.0, liked_topic)

                # 3. Project similarity
                project_sim = 0.0
                if post.type == 'project':
                    if interest_profile['liked_project_tokens']:
                        project_sim = overlap_score(interest_profile['liked_project_tokens'], post_tokens)
                    elif interest_profile['profile_tokens']:
                        project_sim = overlap_score(interest_profile['profile_tokens'], post_tokens)
                    else:
                        project_sim = 0.4

                # 4. Search similarity
                search_sim = overlap_score(interest_profile['search_tokens'], post_tokens)

                # 5. Recency
                recency = get_recency_score(post.created_at)

                # 6. Popularity
                popularity = get_popularity_score(post)

                # Weighted sum
                final_score = (
                    w['content_similarity'] * content_sim +
                    w['liked_topics'] * liked_topic +
                    w['project_similarity'] * project_sim +
                    w['search_similarity'] * search_sim +
                    w['recency'] * recency +
                    w['popularity'] * popularity
                )

                # Determine explanatory reason
                if search_sim >= 0.35:
                    reason = "Related to your recent search"
                elif project_sim >= 0.4 and post.type == 'project':
                    reason = "Recommended project based on your interests"
                elif liked_topic >= 0.4:
                    reason = "Because you liked similar topics"
                elif content_sim >= 0.25:
                    reason = "Based on your interests and skills"
                elif popularity >= 0.6:
                    reason = "Popular on CampusHub"
                else:
                    reason = "Suggested for you"

            scored_candidates.append({
                'post': post,
                'score': round(final_score, 4),
                'reason': reason,
                'author_id': post.author_id,
                'type': post.type
            })

        # Sort candidate posts by score descending
        scored_candidates.sort(key=lambda x: x['score'], reverse=True)

        # Apply Diversity & Author Capping (Feature 17)
        # Cap any individual author to at most 2 posts in the top batch
        final_list = []
        author_counts = {}
        type_counts = {}

        for item in scored_candidates:
            author = item['author_id']
            ptype = item['type']
            current_author_count = author_counts.get(author, 0)
            
            # Allow author capping only when candidate pool is large (> 20)
            if len(scored_candidates) > 20 and current_author_count >= 3:
                continue

            author_counts[author] = current_author_count + 1
            type_counts[ptype] = type_counts.get(ptype, 0) + 1
            
            post_dict = item['post'].to_dict()
            post_dict['recommendationReason'] = item['reason']
            post_dict['recommendationScore'] = item['score']
            final_list.append(post_dict)

            if len(final_list) >= limit:
                break

        return final_list

    @classmethod
    def get_recommendations(cls, user, limit=20):
        """
        Main recommendation pipeline:
        1. Derive user interest profile
        2. Generate candidate pool
        3. Score, rank, and apply diversity
        4. Fallback gracefully if error
        """
        try:
            interest_profile = cls.get_user_interest_profile(user)
            candidates = cls.generate_candidate_pool(user, interest_profile, limit=limit * 4)
            if not candidates:
                fallback_posts = Post.query.order_by(Post.created_at.desc()).limit(limit).all()
                return [p.to_dict() for p in fallback_posts]

            return cls.score_and_rank_posts(user, candidates, interest_profile, limit=limit)
        except Exception as e:
            import traceback
            traceback.print_exc()
            # Fallback on any error (Feature 19)
            fallback_posts = Post.query.order_by(Post.created_at.desc()).limit(limit).all()
            return [p.to_dict() for p in fallback_posts]
