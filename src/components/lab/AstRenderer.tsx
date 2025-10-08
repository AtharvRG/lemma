import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Code, FileText } from 'lucide-react';
import { SyntaxNode } from '@/types';

interface AstNodeProps {
  node: SyntaxNode;
  depth?: number;
  maxDepth?: number;
  isHighlighted?: boolean;
}

interface CollapsibleNodeProps {
  node: SyntaxNode;
  depth: number;
  maxDepth: number;
  isHighlighted: boolean;
}

function CollapsibleAstNode({ node, depth, maxDepth, isHighlighted }: CollapsibleNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = node.children.length > 0;
  const shouldShowChildren = isExpanded && depth < maxDepth && hasChildren;
  
  const indentStyle = { marginLeft: `${depth * 1.2}rem` };
  
  const nodeStyle = isHighlighted 
    ? 'bg-aquamarine/20 border-l-2 border-aquamarine pl-2 rounded-r'
    : '';

  const getNodeIcon = (nodeType: string) => {
    if (nodeType.includes('function') || nodeType.includes('method')) {
      return <Code className="w-3 h-3 text-blue-400" />;
    }
    if (nodeType.includes('class') || nodeType.includes('struct') || nodeType.includes('interface')) {
      return <FileText className="w-3 h-3 text-purple-400" />;
    }
    return null;
  };

  const getNodeColor = (nodeType: string) => {
    if (nodeType.includes('function') || nodeType.includes('method')) {
      return 'text-blue-400';
    }
    if (nodeType.includes('class') || nodeType.includes('struct')) {
      return 'text-purple-400';
    }
    if (nodeType.includes('variable') || nodeType.includes('declaration')) {
      return 'text-green-400';
    }
    if (nodeType.includes('statement') || nodeType.includes('expression')) {
      return 'text-yellow-400';
    }
    if (nodeType.includes('identifier') || nodeType.includes('name')) {
      return 'text-cyan-400';
    }
    return 'text-gray-300';
  };

  return (
    <div className={`text-xs leading-relaxed ${nodeStyle}`}>
      <div 
        style={indentStyle}
        className="flex items-center gap-1.5 py-0.5 hover:bg-white/5 rounded cursor-pointer"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
          )
        ) : (
          <div className="w-3 h-3 flex-shrink-0" />
        )}
        
        {getNodeIcon(node.type)}
        
        <span className={`font-medium ${getNodeColor(node.type)}`}>
          {node.type}
        </span>
        
        <span className="text-gray-500 text-xs">
          [{node.startIndex}-{node.endIndex}]
        </span>
        
        {node.text && node.text.length < 50 && (
          <span className="text-gray-400 italic ml-2 truncate">
            &quot;{node.text.replace(/\n/g, '\\n')}&quot;
          </span>
        )}
        
        {hasChildren && (
          <span className="text-gray-600 text-xs ml-auto">
            ({node.children.length} {node.children.length === 1 ? 'child' : 'children'})
          </span>
        )}
      </div>
      
      {shouldShowChildren && (
        <div className="border-l border-gray-600/30 ml-3">
          {node.children.map((child, index) => (
            <CollapsibleAstNode
              key={`${child.id}-${child.startIndex}-${index}`}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              isHighlighted={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AstRenderer({ node, depth = 0, maxDepth = 8, isHighlighted = false }: AstNodeProps) {
  if (!node) {
    return (
      <div className="text-gray-500 text-sm italic p-4">
        No AST node to display
      </div>
    );
  }

  return (
    <div className="font-mono">
      <CollapsibleAstNode 
        node={node} 
        depth={depth} 
        maxDepth={maxDepth} 
        isHighlighted={isHighlighted}
      />
    </div>
  );
}

export function FocusedAstRenderer({ node, context = 2 }: { node: SyntaxNode; context?: number }) {
  const [focusedNode, setFocusedNode] = useState<SyntaxNode>(node);
  
  // Show the focused node with some context (parent and children)
  const getContextNodes = (targetNode: SyntaxNode): SyntaxNode[] => {
    const nodes: SyntaxNode[] = [];
    
    // Add parent context
    let current = targetNode.parent;
    let parentDepth = 0;
    while (current && parentDepth < context) {
      nodes.unshift(current);
      current = current.parent;
      parentDepth++;
    }
    
    // Add the target node
    nodes.push(targetNode);
    
    return nodes;
  };

  const contextNodes = getContextNodes(focusedNode);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-400 border-b border-gray-600 pb-2">
        <span>Focused View:</span>
        <span className="text-aquamarine">{focusedNode.type}</span>
        {focusedNode.parent && (
          <button
            onClick={() => setFocusedNode(focusedNode.parent!)}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ↑ Parent
          </button>
        )}
      </div>
      
      <div className="font-mono">
        {contextNodes.map((contextNode, index) => (
          <AstRenderer
            key={`${contextNode.id}-${contextNode.startIndex}`}
            node={contextNode}
            depth={index}
            maxDepth={index === contextNodes.length - 1 ? 4 : 1}
            isHighlighted={contextNode === focusedNode}
          />
        ))}
      </div>
      
      {focusedNode.children.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">Children ({focusedNode.children.length}):</div>
          <div className="space-y-1">
            {focusedNode.children.slice(0, 10).map((child, index) => (
              <button
                key={`${child.id}-${child.startIndex}`}
                onClick={() => setFocusedNode(child)}
                className="block w-full text-left p-2 rounded bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${child.type.includes('function') ? 'text-blue-400' : 'text-cyan-400'}`}>
                    {child.type}
                  </span>
                  <span className="text-gray-500 text-xs">
                    [{child.startIndex}-{child.endIndex}]
                  </span>
                  {child.text && child.text.length < 30 && (
                    <span className="text-gray-400 italic text-xs truncate">
                      &quot;{child.text.replace(/\n/g, '\\n')}&quot;
                    </span>
                  )}
                </div>
              </button>
            ))}
            {focusedNode.children.length > 10 && (
              <div className="text-gray-500 text-xs italic">
                ... and {focusedNode.children.length - 10} more children
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}