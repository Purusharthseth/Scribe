import { useState, useEffect } from "react";
import Node from "./Node";
import { AiFillFileAdd, AiOutlineFolderAdd } from "react-icons/ai";
import { Box, Flex, Text, Separator } from '@radix-ui/themes';
import useAxios from '@/utils/useAxios';


function findAllAncestorIds(data, targetId) {
  let res = [];
  function dfs(nodes) { 
    for (let node of nodes) {
      res.push(node.id);
      if (node.id === targetId) {
        res.pop();
        return true;
      }
      if (node.isFolder && node.children) {
        if (dfs(node.children)) {
          return true; 
        }
      }
      res.pop();
    }
    return false;
  }
  if(!dfs(data)) console.log("Node not found.");
  return res;
}

function Tree({vaultId}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const axios = useAxios();
  
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);

  // Fetch file tree when vaultId changes
  useEffect(() => {
    if (!vaultId) return;
    
    setLoading(true);
    const controller = new AbortController();
    
    (async () => {
      try {
        const res = await axios.get(`/api/vaults/${vaultId}`, { 
          signal: controller.signal 
        });
        const tree = res?.data?.data?.file_tree || [];
        console.log(res.data.data);
        setData(Array.isArray(tree) ? tree : []);
      } catch (e) {
        if (e.code !== "ERR_CANCELED") {
          console.error("Failed to fetch vault tree:", e);
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    })();
    
    return () => controller.abort();
  }, [vaultId]);

  // Save tree changes back to API
  const saveTreeToAPI = async (newTree) => {
    if (!vaultId) return;
    try {
      await axios.put(`/api/vaults/${vaultId}/file-tree`, {
        fileTree: newTree
      });
    } catch (e) {
      console.error("Failed to save tree:", e);
    }
  };

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
      saveTreeToAPI(temp);
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
    saveTreeToAPI(temp);

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
          curr.splice(i, 1); //for deletion
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
      saveTreeToAPI(temp);
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
    saveTreeToAPI(DFS(data));
  };

  const addFolder = (newNodeName, parentId) => {
    const NODE = {
      id: Date.now(),
      name: newNodeName,
      isFolder: true,
      children: [],
    };

    if (parentId === null) {
      const newTree = [...data, NODE];
      setData(newTree);
      saveTreeToAPI(newTree);
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

    const newTree = DFS(data);
    setData(newTree);
    saveTreeToAPI(newTree);

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
    <Box pt="3" className="text-sm font-medium text-[var(--gray-11)]">
      <Flex gap="3" justify="between" px="4" pb="1" align="center">
        <Text size="2" weight="medium" className="text-[var(--blue-11)]">FILE TREE</Text>
        <Flex gap="3">
          <AiFillFileAdd
            className="cursor-pointer hover:text-[var(--blue-9)]"
            title="Add File"
            onClick={() => {
              addNode("new_file.md", selectedId ?? null);
            }}
          />
          <AiOutlineFolderAdd
            className="cursor-pointer hover:text-[var(--blue-9)]"
            title="Add Folder"
            onClick={() => {
              addFolder("New Folder", selectedId ?? null);
            }}
          />
        </Flex>
      </Flex>
      <Separator size="4" />

      {loading ? (
        <Box p="4">
          <Text size="2" color="gray">Loading files...</Text>
        </Box>
      ) : (
        /* Tree rendering */
        data.map((node) => (
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
        ))
      )}
    </Box>
  );
}

export default Tree;
