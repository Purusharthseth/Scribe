import { useState } from "react";
import Node from "./Node";
import { AiFillFileAdd, AiOutlineFolderAdd } from "react-icons/ai";

const files = [
  {
    id: 1,
    name: "public",
    isFolder: true,
    children: [
      {
        id: 2,
        name: "index.html",
        isFolder: false,
      },
    ],
  },
  {
    id: 3,
    name: "src",
    isFolder: true,
    children: [
      {
        id: 4,
        name: "components",
        isFolder: true,
        children: [
          {
            id: 5,
            name: "test",
            isFolder: true,
            children: [
              {
                id: 6,
                name: "file.js",
                isFolder: false,
              },
            ],
          },
        ],
      },
      {
        id: 7,
        name: "App.js",
        isFolder: false,
      },
    ],
  },
];

// Helper to find all ancestor ids of a node
function findAllAncestorIds(data, targetId) {
  let res = [];
  function dfs(nodes, ancestors) {
    for (let node of nodes) {
      if (node.id === targetId) {
        res = [...ancestors]; // return ancestors only, not including targetId
        return true;
      }
      if (node.isFolder && node.children) {
        if (dfs(node.children, [...ancestors, node.id])) return true;
      }
    }
    return false;
  }
  dfs(data, []);
  return res;
}

function Tree() {
  const [data, setData] = useState(files);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);

  const addNode = (newNode, parentId) => {
    const temp = structuredClone(data);
    const NODE = {
      id: Date.now(),
      name: newNode,
      isFolder: false,
    };

    if (parentId === null) {
      temp.push(NODE);
      setData(temp);
      return;
    }

    const DFS = (curr) => {
      for (let node of curr) {
        if (node.id === parentId) {
          node.children = node.children || [];
          node.children.push(NODE);
          return true;
        }
        if (node.isFolder) {
          if (DFS(node.children)) return true;
        }
      }
    };
    DFS(temp);
    setData(temp);

    // Expand all ancestors and the parent folder
    const ancestorIds = findAllAncestorIds(data, parentId);
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      ancestorIds.forEach((id) => newSet.add(id));
      newSet.add(parentId);
      return newSet;
    });
  };

  const deleteNode = (nodeId) => {
    if (selectedId === nodeId) {
      setSelectedId(null);
    }
    const temp = structuredClone(data);
    const DFS = (curr) => {
      for (let i = 0; i < curr.length; i++) {
        if (curr[i].id === nodeId) {
          curr.splice(i, 1);
          return true;
        }
        if (curr[i].isFolder && curr[i].children) {
          if (DFS(curr[i].children)) return true;
        }
      }
      return false;
    };

    if (DFS(temp)) {
      setData(temp);
    }
  };

  const editNode = (nodeId, newName) => {
    const DFS = (curr) => {
      return curr.map((node) => {
        if (node.id === nodeId) {
          return { ...node, name: newName };
        }
        if (node.isFolder && node.children) {
          return { ...node, children: DFS(node.children) };
        }
        return node;
      });
    };

    setData(DFS(data));
  };

  const addFolder = (newNodeName, parentId) => {
    const NODE = {
      id: Date.now(),
      name: newNodeName,
      isFolder: true,
      children: [],
    };

    if (parentId === null) {
      setData([...data, NODE]);
      return;
    }

    const DFS = (curr) => {
      return curr.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), NODE],
          };
        }
        if (node.isFolder && node.children) {
          return {
            ...node,
            children: DFS(node.children),
          };
        }
        return node;
      });
    };

    setData(DFS(data));

    // Expand all ancestors and the parent
    const ancestorIds = findAllAncestorIds(data, parentId);
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      ancestorIds.forEach((id) => newSet.add(id));
      newSet.add(parentId);
      return newSet;
    });
  };

  return (
    <div className="pt-3 text-sm font-medium text-slate-200">
      <div className="flex gap-3 justify-between px-4 pb-1 text-lg text-slate-400">
        <span className="text-blue-300 text-sm ">FILE TREE</span>
        <div className="flex gap-3">
          <AiFillFileAdd
            className="cursor-pointer hover:text-blue-500"
            title="Add File"
            onClick={() => {
              addNode("new_file.md", selectedId ?? null);
            }}
          />
          <AiOutlineFolderAdd
            className="cursor-pointer hover:text-blue-500"
            title="Add Folder"
            onClick={() => {
              addFolder("New Folder", selectedId ?? null);
            }}
          />
        </div>
      </div>
      <hr className="text-blue-300" />

      {/* Tree rendering */}
      {data.map((node) => (
        <Node
          key={node.id}
          obj={node}
          addNode={addNode}
          deleteNode={deleteNode}
          editNode={editNode}
          addFolder={addFolder}
          expandedIds={expandedIds}
          setExpandedIds={setExpandedIds}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ))}
    </div>
  );
}

export default Tree;
