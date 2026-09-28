import React, { useState, useEffect, useRef } from 'react';
import { storageManager } from '../../services/storageManager';

import {
  ArrowLeft, X, Sparkles, Send, Save, FileText, CheckCircle2,
  AlertCircle, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon,
  Code, Quote, Eye, Edit3, Type
} from 'lucide-react';
import PostTypeSelector from './PostTypeSelector';
import EventDetailsForm from './EventDetailsForm';
import MediaUploader from './MediaUploader';
import PostVisibility from './PostVisibility';
import PostPreview from './PostPreview';
import DraftsModal from './DraftsModal';
import ModalPortal from '../common/ModalPortal';
import FormattedText, { cleanMarkdownToHtml } from '../common/FormattedText';
import { usePopup } from '../common/PopupDialog';

export default function CreatePost({
  user,
  initialPost = null, // if editing an existing post
  onPublish,
  onClose,
}) {
  const { showConfirm, showAlert, showPrompt } = usePopup();

  // Form State
  const [postType, setPostType] = useState(initialPost?.type || 'project');
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.description || initialPost?.content || '');
  const [tags, setTags] = useState(
    Array.isArray(initialPost?.tags) ? initialPost.tags.join(', ') : (initialPost?.tags || '')
  );
  const [visibility, setVisibility] = useState(initialPost?.visibility || 'everyone');
  const [media, setMedia] = useState(
    initialPost?.media || (initialPost?.image ? [{ id: 'img-1', url: initialPost.image, name: 'Attachment', size: 'Image', type: 'image/jpeg' }] : [])
  );
  const [eventDetails, setEventDetails] = useState(
    initialPost?.eventDetails || {
      eventDate: initialPost?.eventDate || new Date().toISOString().split('T')[0],
      startTime: initialPost?.eventTime || '10:00',
      endTime: '16:00',
      venue: initialPost?.location || '',
      duration: initialPost?.duration || '3 Hours',
      category: initialPost?.category || 'Hackathon',
      participantType: initialPost?.participantType || 'single',
      minTeamSize: initialPost?.minTeamSize || 2,
      maxTeamSize: initialPost?.maxTeamSize || 4,
      registrationUrl: initialPost?.registrationUrl || '',
      contactInfo: initialPost?.contactInfo || '',
    }
  );

  // Status & Validation State
  const [errors, setErrors] = useState({});
  const [mediaError, setMediaError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [mobileActiveTab, setMobileActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [contentViewTab, setContentViewTab] = useState('write'); // 'write' | 'preview'
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
    code: false,
    quote: false,
    link: false,
  });

  // Load saved drafts from storageManager
  useEffect(() => {
    (async () => {
      try {
        const savedDrafts = await storageManager.getItem('campushub_drafts');
        if (savedDrafts && Array.isArray(savedDrafts)) {
          setDrafts(savedDrafts.filter((d) => d.authorId === user?.username));
        }
      } catch (err) {
        console.error('Failed to load drafts:', err);
      }
    })();
  }, [user]);


  // Sync initial content or loaded drafts into editorRef HTML
  useEffect(() => {
    if (editorRef.current && contentViewTab === 'write') {
      const targetHtml = cleanMarkdownToHtml(content);
      if (editorRef.current.innerHTML !== targetHtml && (!editorRef.current.contains(document.activeElement) || !editorRef.current.innerHTML.trim())) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
  }, [contentViewTab]);

  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = cleanMarkdownToHtml(content);
    }
  }, []);

  // Check for unsaved changes
  const hasUnsavedChanges = Boolean(
    title.trim() ||
    content.trim() ||
    media.length > 0 ||
    (postType === 'event' && eventDetails.venue)
  );

  const handleAttemptClose = async () => {
    if (hasUnsavedChanges) {
      const confirm = await showConfirm(
        'You have entered content for this post. Do you want to leave without saving?',
        'Unsaved Changes',
        { confirmText: 'Leave Without Saving', cancelText: 'Stay & Edit', isDanger: true }
      );
      if (confirm) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Update toolbar active formatting indicators based on current caret/selection
  const updateActiveFormats = () => {
    try {
      const selection = window.getSelection();
      let isCode = false;
      let isQuote = false;
      let isLink = false;

      if (selection && selection.rangeCount > 0 && editorRef.current) {
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeName === 'CODE') isCode = true;
          if (node.nodeName === 'BLOCKQUOTE') isQuote = true;
          if (node.nodeName === 'A') isLink = true;
          node = node.parentNode;
        }
      }

      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        code: isCode,
        quote: isQuote,
        link: isLink,
      });
    } catch {
      // ignore
    }
  };

  // Sync content state when user types or edits in visual composer
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const textOnly = editorRef.current.innerText.trim();
    const updated = textOnly ? html : '';
    setContent(updated);
    if (errors.content && textOnly) {
      setErrors((prev) => ({ ...prev, content: null }));
    }
    updateActiveFormats();
  };

  // Execute formatting directly in the visual editor (0 raw asterisks)
  const executeFormat = async (cmd, val = null) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    if (cmd === 'createLink') {
      const selection = window.getSelection();
      let savedRange = null;
      let defaultVal = 'https://';

      if (selection && selection.rangeCount > 0) {
        const tempRange = selection.getRangeAt(0);
        if (editor.contains(tempRange.commonAncestorContainer)) {
          savedRange = tempRange.cloneRange();
          const selText = savedRange.toString().trim();
          if (selText.startsWith('http://') || selText.startsWith('https://')) {
            defaultVal = selText;
          }
        }
      }

      const url = await showPrompt(
        'Enter website link URL (e.g. https://github.com or https://example.com):',
        'Insert Link',
        defaultVal,
        {
          placeholder: 'https://example.com',
          confirmText: 'Insert Link',
          cancelText: 'Cancel'
        }
      );

      if (url && typeof url === 'string' && url.trim()) {
        const cleanUrl = url.trim();
        const safeUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('mailto:')
          ? cleanUrl
          : `https://${cleanUrl}`;

        editor.focus();
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
            sel.addRange(savedRange);
          } else {
            const endRange = document.createRange();
            endRange.selectNodeContents(editor);
            endRange.collapse(false);
            sel.addRange(endRange);
            savedRange = endRange;
          }
        }

        if (savedRange && !savedRange.collapsed) {
          document.execCommand('createLink', false, safeUrl);
        } else {
          document.execCommand('insertHTML', false, `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>&nbsp;`);
        }

        // Ensure links have proper attributes
        const anchors = editor.querySelectorAll('a');
        anchors.forEach((a) => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        });
      }
    } else if (cmd === 'code') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if selection is already inside a <code> tag
        let codeParent = null;
        let curr = range.commonAncestorContainer;
        while (curr && curr !== editor) {
          if (curr.nodeName === 'CODE') {
            codeParent = curr;
            break;
          }
          curr = curr.parentNode;
        }

        if (codeParent) {
          // Toggle off: unwrap <code> tag
          const textNode = document.createTextNode(codeParent.textContent);
          codeParent.parentNode.replaceChild(textNode, codeParent);
        } else if (!range.collapsed) {
          const selectedText = range.toString();
          const codeEl = document.createElement('code');
          codeEl.className = 'post-inline-code';
          codeEl.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeEl);

          // Move cursor after the code element
          range.setStartAfter(codeEl);
          range.setEndAfter(codeEl);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Insert placeholder inline code
          const codeEl = document.createElement('code');
          codeEl.className = 'post-inline-code';
          codeEl.textContent = 'code';
          range.insertNode(codeEl);

          const spaceNode = document.createTextNode('\u00A0');
          if (codeEl.nextSibling) {
            codeEl.parentNode.insertBefore(spaceNode, codeEl.nextSibling);
          } else {
            codeEl.parentNode.appendChild(spaceNode);
          }
          range.setStartAfter(spaceNode);
          range.setEndAfter(spaceNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } else if (cmd === 'quote') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if already inside a blockquote
        let bqParent = null;
        let curr = range.commonAncestorContainer;
        while (curr && curr !== editor) {
          if (curr.nodeName === 'BLOCKQUOTE') {
            bqParent = curr;
            break;
          }
          curr = curr.parentNode;
        }

        if (bqParent) {
          // Toggle quote off: convert blockquote to paragraph
          const p = document.createElement('p');
          p.innerHTML = bqParent.innerHTML;
          bqParent.parentNode.replaceChild(p, bqParent);
        } else if (!range.collapsed) {
          const bq = document.createElement('blockquote');
          bq.appendChild(range.extractContents());
          range.insertNode(bq);
        } else {
          // Insert a quote block
          const bq = document.createElement('blockquote');
          bq.textContent = 'Quote text here...';
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          range.insertNode(p);
          range.insertNode(bq);

          range.selectNodeContents(bq);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } else if (cmd === 'removeFormat') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const plainText = range.toString();
          range.deleteContents();
          const textNode = document.createTextNode(plainText);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          document.execCommand('removeFormat', false, null);
          document.execCommand('unlink', false, null);
          document.execCommand('formatBlock', false, 'p');
        }
      }
    } else {
      document.execCommand(cmd, false, val);
    }

    handleEditorInput();
    updateActiveFormats();
  };

  // Keyboard shortcut listener
  const handleEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      executeFormat('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      executeFormat('italic');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      executeFormat('underline');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      executeFormat('createLink');
    }
  };

  // Paste handler: convert any raw markdown asterisks to clean HTML instantly without displaying asterisks
  const handleEditorPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      const cleanedHtml = cleanMarkdownToHtml(text).replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, cleanedHtml);
      handleEditorInput();
    }
  };


  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Please enter a post title.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    } else if (title.trim().length > 150) {
      newErrors.title = 'Title cannot exceed 150 characters.';
    }

    const plainText = editorRef.current ? editorRef.current.innerText.trim() : content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      newErrors.content = 'Post content cannot be empty.';
    } else if (plainText.length < 5) {
      newErrors.content = 'Please write at least 5 characters for your post.';
    }

    if (postType === 'event') {
      if (!eventDetails.eventDate) {
        newErrors.eventDate = 'Event date is required.';
      }
      if (!eventDetails.startTime) {
        newErrors.startTime = 'Start time is required.';
      }
      if (!eventDetails.venue || !eventDetails.venue.trim()) {
        newErrors.venue = 'Please specify an event venue or platform.';
      }
      if (eventDetails.registrationUrl && !/^https?:\/\/.+/.test(eventDetails.registrationUrl)) {
        newErrors.registrationUrl = 'Please enter a valid URL starting with http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      setErrors({ title: 'Enter at least a title or some content to save as draft.' });
      return;
    }

    try {
      const draftItem = {
        id: initialPost?.id || `draft_${Date.now()}`,
        authorId: user.username,
        author: { name: user.username, avatar: user.avatar || user.username.slice(0, 2).toUpperCase() },
        title: title.trim(),
        content: content.trim(),
        type: postType,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility,
        media,
        eventDetails: postType === 'event' ? eventDetails : null,
        status: 'DRAFT',
        savedAt: new Date().toISOString(),
      };

      const existingDrafts = (await storageManager.getItem('campushub_drafts')) || [];
      const updatedDrafts = [draftItem, ...existingDrafts.filter((d) => d.id !== draftItem.id)];
      storageManager.setItem('campushub_drafts', updatedDrafts);

      setDrafts(updatedDrafts.filter((d) => d.authorId === user.username));
      setToastMessage('✓ Draft saved securely. You can return and continue editing anytime.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setErrors({ form: 'Failed to save draft locally. Please try again.' });
    }
  };

  // Load selected draft
  const handleLoadDraft = (draft) => {
    setPostType(draft.type || 'project');
    setTitle(draft.title || '');
    const loadedContent = draft.content || '';
    setContent(loadedContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = cleanMarkdownToHtml(loadedContent);
    }
    setTags(Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags || '');
    setVisibility(draft.visibility || 'everyone');
    setMedia(draft.media || []);
    if (draft.eventDetails) setEventDetails(draft.eventDetails);
    setShowDraftsModal(false);
    setToastMessage(`✓ Draft "${draft.title || 'Untitled'}" loaded.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Delete draft
  const handleDeleteDraft = async (draftId) => {
    try {
      const existingDrafts = (await storageManager.getItem('campushub_drafts')) || [];
      const updated = existingDrafts.filter((d) => d.id !== draftId);
      storageManager.setItem('campushub_drafts', updated);
      setDrafts(updated.filter((d) => d.authorId === user.username));
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };


  // Submit & Publish Post
  const handlePublishPost = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Primary banner image fallback
      const primaryImage = media.find((m) => m.type?.startsWith('image/'))?.url || media[0]?.url || null;

      const newPostObject = {
        id: initialPost?.id || Date.now(),
        authorId: user.username,
        author: {
          name: user.username,
          avatar: user.avatar || user.username.slice(0, 2).toUpperCase(),
        },
        title: title.trim(),
        description: content.trim(),
        content: content.trim(),
        type: postType,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility,
        image: primaryImage,
        media,
        eventDetails: postType === 'event' ? eventDetails : null,
        // Legacy event fields for full backwards compatibility
        location: postType === 'event' ? eventDetails.venue : null,
        eventDate: postType === 'event' ? eventDetails.eventDate : null,
        eventTime: postType === 'event' ? eventDetails.startTime : null,
        duration: postType === 'event' ? eventDetails.duration : null,
        category: postType === 'event' ? eventDetails.category : null,
        participantType: postType === 'event' ? eventDetails.participantType : null,
        minTeamSize: postType === 'event' ? eventDetails.minTeamSize : null,
        maxTeamSize: postType === 'event' ? eventDetails.maxTeamSize : null,
        registrationUrl: postType === 'event' ? eventDetails.registrationUrl : null,
        contactInfo: postType === 'event' ? eventDetails.contactInfo : null,
        // Metrics & status
        status: 'PUBLISHED',
        likes: initialPost?.likes || 0,
        likedBy: initialPost?.likedBy || [],
        comments: initialPost?.comments || [],
        date: initialPost ? 'Updated just now' : 'Just now',
        createdAt: initialPost?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Clean up any matching draft if it was drafted
      if (initialPost?.id) {
        handleDeleteDraft(initialPost.id);
      }

      await onPublish(newPostObject);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Publishing error:', err);
      setIsSubmitting(false);
      setErrors({ form: 'Unable to publish your post. Please check your connection and try again.' });
    }
  };

  const isOwner = !initialPost?.id || !initialPost?.authorId || initialPost.authorId === user?.username || initialPost.author?.name === user?.username;

  if (initialPost?.id && !isOwner) {
    return (
      <div className="create-post-overlay">
        <div className="create-post-container" style={{ maxWidth: '480px', margin: 'auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.4rem' }}>Permission Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
            Strict security policy: You are not authorized to edit this post. Only the original creator/owner (<strong>{initialPost.authorId || initialPost.author?.name}</strong>) has permission to edit it.
          </p>
          <button type="button" className="primary-btn" onClick={onClose} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={16} /> Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const previewData = {
    title,
    content,
    type: postType,
    tags,
    visibility,
    media,
    eventDetails: postType === 'event' ? eventDetails : null,
  };

  return (
    <div className="create-post-overlay">
      <div className="create-post-container">
        {/* Top Header */}
        <div className="create-post-header">
          <div className="header-left">
            <button
              type="button"
              className="back-btn"
              onClick={handleAttemptClose}
              title="Back to feed"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <div className="header-titles">
              <h1 className="create-post-title">
                {initialPost ? 'Edit Post' : 'Create New Post'}
              </h1>
              <p className="create-post-subtitle">
                Share updates, announcements, events and useful information with your campus community.
              </p>
            </div>
          </div>

          <div className="header-actions">
            {drafts.length > 0 && (
              <button
                type="button"
                className="drafts-btn"
                onClick={() => setShowDraftsModal(true)}
              >
                <FileText size={15} /> Drafts ({drafts.length})
              </button>
            )}
            <button
              type="button"
              className="icon-btn close-circle-btn"
              onClick={handleAttemptClose}
              title="Close editor"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tabs */}
        <div className="mobile-editor-tabs">
          <button
            type="button"
            className={`editor-tab-btn ${mobileActiveTab === 'editor' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('editor')}
          >
            ✏️ Post Editor
          </button>
          <button
            type="button"
            className={`editor-tab-btn ${mobileActiveTab === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('preview')}
          >
            <Eye size={15} /> Live Preview
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="composer-toast">
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* General Form Error Alert */}
        {errors.form && (
          <div className="composer-error-alert">
            <AlertCircle size={18} />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Main Split Layout: Editor (Left) & Real-time Live Preview (Right) */}
        <div className="create-post-body">
          {/* Left Column: Post Composer Form */}
          <div className={`composer-panel ${mobileActiveTab === 'editor' ? 'active-mobile-pane' : 'hidden-mobile-pane'}`}>
            <form onSubmit={handlePublishPost} noValidate>
              {/* 1. Post Type Selector */}
              <PostTypeSelector selectedType={postType} onSelectType={setPostType} />

              {/* 2. Post Title Input */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label">
                    Post Title <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: title.length > 150 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {title.length} / 150
                  </span>
                </div>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'input-error' : ''}`}
                  placeholder="Enter a clear, descriptive title for your post..."
                  value={title}
                  maxLength={150}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                  }}
                  required
                />
                {errors.title && <span className="field-error-text">{errors.title}</span>}
              </div>

              {/* 3. Rich Text Content Editor */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Post Content <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>

                    {/* View Switcher: Write vs Preview */}
                    <div className="content-view-switch">
                      <button
                        type="button"
                        className={`content-view-btn ${contentViewTab === 'write' ? 'active' : ''}`}
                        onClick={() => setContentViewTab('write')}
                        title="Interactive Visual Editor"
                      >
                        <Edit3 size={12} /> <span>Write</span>
                      </button>
                      <button
                        type="button"
                        className={`content-view-btn ${contentViewTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setContentViewTab('preview')}
                        title="Preview Formatted Output"
                      >
                        <Eye size={12} /> <span>Preview</span>
                      </button>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {editorRef.current ? editorRef.current.innerText.length : (content.replace(/<[^>]*>/g, '').length)} / 3000
                  </span>
                </div>

                {contentViewTab === 'write' ? (
                  <>
                    {/* Visual Rich Formatting Toolbar */}
                    <div className="formatting-toolbar">
                      <button 
                        type="button" 
                        className={`toolbar-btn bold-btn ${activeFormats.bold ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('bold')} 
                        title="Bold (Ctrl+B) — Highlight text to bold directly without asterisks"
                      >
                        <Bold size={15} />
                        <span className="btn-label-hint">Bold</span>
                      </button>
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.italic ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('italic')} 
                        title="Italic (Ctrl+I)"
                      >
                        <Italic size={15} />
                      </button>
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.underline ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('underline')} 
                        title="Underline (Ctrl+U)"
                      >
                        <Underline size={15} />
                      </button>
                      <div className="toolbar-divider" />
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.unorderedList ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('insertUnorderedList')} 
                        title="Bullet List"
                      >
                        <List size={15} />
                      </button>
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.orderedList ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('insertOrderedList')} 
                        title="Numbered List"
                      >
                        <ListOrdered size={15} />
                      </button>
                      <div className="toolbar-divider" />
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.link ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('createLink')} 
                        title="Insert Link (Ctrl+K)"
                      >
                        <LinkIcon size={15} />
                      </button>
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.code ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('code')} 
                        title="Code Snippet"
                      >
                        <Code size={15} />
                      </button>
                      <button 
                        type="button" 
                        className={`toolbar-btn ${activeFormats.quote ? 'is-active' : ''}`} 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('quote')} 
                        title="Quote Block"
                      >
                        <Quote size={15} />
                      </button>
                      <button 
                        type="button" 
                        className="toolbar-btn" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeFormat('removeFormat')} 
                        title="Clear Formatting"
                      >
                        <Type size={15} />
                      </button>
                      <span className="toolbar-hint">Highlight text &amp; click Bold (or Ctrl+B)</span>
                    </div>

                    {/* Interactive WYSIWYG Content Area */}
                    <div
                      ref={editorRef}
                      contentEditable={true}
                      className={`form-control rich-text-composer-editor ${errors.content ? 'input-error' : ''}`}
                      onInput={handleEditorInput}
                      onKeyDown={handleEditorKeyDown}
                      onKeyUp={updateActiveFormats}
                      onMouseUp={updateActiveFormats}
                      onPaste={handleEditorPaste}
                      data-placeholder="Write something for your campus community... (Highlight text and click Bold to format interactively with no * symbols)"
                      role="textbox"
                      aria-multiline="true"
                      spellCheck="true"
                    />

                    {/* Live Inline Preview Box if there is content */}
                    {content.trim() && (
                      <div className="composer-live-preview-box">
                        <div className="live-preview-box-header">
                          <Sparkles size={13} color="var(--accent-primary)" />
                          <span>Live Formatted Output:</span>
                        </div>
                        <div className="live-preview-box-content post-description">
                          <FormattedText text={content} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Formatted Preview Tab View */
                  <div className="composer-preview-pane">
                    <div className="preview-pane-header">
                      <span>Formatted Text View ({editorRef.current ? editorRef.current.innerText.length : (content.replace(/<[^>]*>/g, '').length)} chars)</span>
                    </div>
                    <div className="preview-pane-content post-description">
                      {content.trim() ? (
                        <FormattedText text={content} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No content entered yet. Switch to "Write" to start typing...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {errors.content && <span className="field-error-text">{errors.content}</span>}
              </div>

              {/* 4. Tags Input */}
              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">
                  Tags <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>(comma separated)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. AI/ML, Hackathon, Placement, Cultural, Robotics"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/* 5. Event Specific Fields (When Post Type is Event) */}
              {postType === 'event' && (
                <EventDetailsForm
                  eventData={eventDetails}
                  onChange={setEventDetails}
                  errors={errors}
                />
              )}

              {/* 6. Media / Image Uploader */}
              <div style={{ marginTop: '1.5rem' }}>
                <MediaUploader
                  media={media}
                  onMediaChange={setMedia}
                  error={mediaError}
                  onError={setMediaError}
                />
              </div>

              {/* 7. Post Visibility Targeting */}
              <div style={{ marginTop: '1.5rem' }}>
                <PostVisibility visibility={visibility} onSelectVisibility={setVisibility} />
              </div>

              {/* Bottom Actions Bar */}
              <div className="composer-footer-actions">
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-btn save-draft-btn"
                    onClick={handleSaveDraft}
                    title="Save current progress as a private draft"
                  >
                    <Save size={16} /> Save Draft
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleAttemptClose}
                  >
                    Cancel
                  </button>
                </div>

                <button
                  type="submit"
                  className="primary-btn publish-submit-btn pulse-hover"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> {initialPost ? 'Update Post' : 'Publish Post'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Real-Time Preview */}
          <div className={`preview-panel ${mobileActiveTab === 'preview' ? 'active-mobile-pane' : 'hidden-mobile-pane'}`}>
            <PostPreview postData={previewData} user={user} />
          </div>
        </div>
      </div>

      {/* Saved Drafts Modal */}
      {showDraftsModal && (
        <DraftsModal
          drafts={drafts}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
          onClose={() => setShowDraftsModal(false)}
        />
      )}
    </div>
  );
}
