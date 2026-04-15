import React from 'react';
import { useAppStore } from '../../store';
import type { FileNode } from '../../../shared/types';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth }) => {
  return (
    <div className="file-tree-item" style={{ paddingLeft: depth * 16 }}>
      <span className="file-tree-icon">{node.type === 'directory' ? '📁' : '📄'}</span>
      <span className="file-tree-name">{node.name}</span>
    </div>
  );
};

export const FileTree: React.FC = () => {
  const { fileTree } = useAppStore();

  const renderTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => (
      <React.Fragment key={node.path}>
        <FileTreeItem node={node} depth={depth} />
        {node.children && node.isExpanded && renderTree(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  return <div className="file-tree">{renderTree(fileTree)}</div>;
};
