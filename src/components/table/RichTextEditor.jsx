/**
 * RichTextEditor.jsx
 * 富文本编辑器组件（基于 TipTap）
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Modal, Button, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  MinusOutlined,
  FontColorsOutlined,
} from '@ant-design/icons';

const RichTextEditor = ({ value, onChange, visible, onClose }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '输入内容...',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  if (!editor) {
    return null;
  }

  const handleSave = () => {
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="富文本编辑"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
      ]}
      width={800}
      destroyOnHidden
    >
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, marginBottom: 16 }}>
        {/* 工具栏 */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid #d9d9d9',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            backgroundColor: '#fafafa',
          }}
        >
          <Tooltip title="标题">
            <Button
              size="small"
              icon={<FontColorsOutlined />}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
            />
          </Tooltip>

          <Tooltip title="加粗">
            <Button
              size="small"
              icon={<BoldOutlined />}
              onClick={() => editor.chain().focus().toggleBold().run()}
              type={editor.isActive('bold') ? 'primary' : 'default'}
            />
          </Tooltip>

          <Tooltip title="斜体">
            <Button
              size="small"
              icon={<ItalicOutlined />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              type={editor.isActive('italic') ? 'primary' : 'default'}
            />
          </Tooltip>

          <Tooltip title="无序列表">
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              type={editor.isActive('bulletList') ? 'primary' : 'default'}
            />
          </Tooltip>

          <Tooltip title="有序列表">
            <Button
              size="small"
              icon={<OrderedListOutlined />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              type={editor.isActive('orderedList') ? 'primary' : 'default'}
            />
          </Tooltip>

          <Tooltip title="分割线">
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />
          </Tooltip>
        </div>

        {/* 编辑器内容区 */}
        <div
          style={{
            minHeight: 300,
            maxHeight: 500,
            overflowY: 'auto',
            padding: 12,
          }}
        >
          <EditorContent
            editor={editor}
            style={{
              minHeight: 280,
              outline: 'none',
            }}
          />
          <style>{`
            .ProseMirror {
              min-height: 280px;
              outline: none;
            }
            .ProseMirror p {
              margin: 8px 0;
            }
            .ProseMirror h1,
            .ProseMirror h2,
            .ProseMirror h3 {
              margin: 16px 0 8px;
              font-weight: 600;
            }
            .ProseMirror ul,
            .ProseMirror ol {
              padding-left: 24px;
              margin: 8px 0;
            }
            .ProseMirror hr {
              margin: 16px 0;
              border: none;
              border-top: 1px solid #d9d9d9;
            }
            .ProseMirror strong {
              font-weight: 600;
            }
            .ProseMirror em {
              font-style: italic;
            }
            .ProseMirror-focused {
              outline: none;
            }
          `}</style>
        </div>
      </div>
    </Modal>
  );
};

export default RichTextEditor;
