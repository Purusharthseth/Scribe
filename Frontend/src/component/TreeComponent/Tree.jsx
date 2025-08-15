import { useState, useEffect } from "react";
import Node from "./Node";
import { AiFillFileAdd, AiOutlineFolderAdd } from "react-icons/ai";
import { Box, Flex, Text, Separator } from '@radix-ui/themes';
import useAxios from '@/utils/useAxios';
import useVaultStore from '@/store/useVaultStore';
import toast from 'react-hot-toast';

function findAllAncestorIds(data, targetId) {
  let res = [];
  function dfs(nodes) { 
    for (let node of nodes) {
      res.push(node.id);
      if (node.id === targetId) {
        res.pop(); 
        return true;
      }
      if (node.type === "folder" && node.children) {
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

function isFileInsideFolder(data, fileId, folderId) {
  function findFileParentPath(nodes, targetFileId, currentPath = []) {
    for (let node of nodes) {
      if (node.id === targetFileId && node.type === "file") {
        return currentPath;
      }
      if (node.type === "folder" && node.children) {
        const found = findFileParentPath(node.children, targetFileId, [...currentPath, node.id]);
        if (found) return found;
      }
    }
    return null;
  }

  const parentPath = findFileParentPath(data, fileId);
  return parentPath ? parentPath.includes(folderId) : false;
}

function Tree({vaultId}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const axios = useAxios();
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const selectedFile= useVaultStore((s)=>s.selectedFile);
  const setSelectedFile = useVaultStore((s)=>s.setSelectedFile);

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

  const addNode = async (newNodeName, parentId) => {
    if (!newNodeName || newNodeName.trim() === '') {
      toast.error('File name cannot be empty');
      return false;
    }
    try {
      const res = await axios.post('/api/files', {
        vaultId,
        name: newNodeName.trim(),
        content: '',
        folderId: parentId || null
      });
      setData(res.data.data.file_tree);
      
      if (parentId) {
        const ancestorIds = findAllAncestorIds(res.data.data.file_tree, parentId);
        setExpandedIds(prev => new Set([...prev, parentId, ...ancestorIds]));
      }
      return true; 
    } catch (e) {
      console.error("Failed to add file:", e);
      console.error("Error details:", e.response?.data);
      toast.error('Failed to create file');
      return false;
    }
  };

  const deleteNode = async (nodeId, nodeType) => {
    const shouldClearSelectedFile = selectedFile && (
      (nodeType === "file" && selectedFile.id === nodeId) ||
      (nodeType === "folder" && isFileInsideFolder(data, selectedFile.id, nodeId))
    );
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    
    try {
      let res;
      if (nodeType === "folder") {
        res = await axios.delete(`/api/folders/${nodeId}`, {
          data: { vaultId }
        });
      } else {
        res = await axios.delete(`/api/files/${nodeId}`, {
          data: { vaultId }
        });
      }
      setData(res.data.data.file_tree);
      if (shouldClearSelectedFile) {
        setSelectedFile(null);
        console.log("Cleared selected file due to deletion");
      }
    } catch (e) {
      toast.error(`Failed to delete ${nodeType}`);
      console.error("Failed to delete node:", e);
      console.error("Error details:", e.response?.data);
    }
  };

  const editNode = async (nodeId, newName, nodeType) => {
    if (!newName || newName.trim() === '') {
      const itemType = nodeType === "folder" ? "Folder" : "File";
      toast.error(`${itemType} name cannot be empty`);
      return false; 
    }
    try {
      let res;
      if (nodeType === "folder") {
        res = await axios.put(`/api/folders/${nodeId}/name`, {
          vaultId,
          newName: newName.trim()
        });
      } else {
        res = await axios.put(`/api/files/${nodeId}/name`, {
          vaultId,
          newName: newName.trim()
        });
      }
      setData(res.data.data.file_tree);
      return true; 
    } catch (e) {
      console.error("Failed to edit node:", e);
      console.error("Error details:", e.response?.data);
      const itemType = nodeType === "folder" ? "folder" : "file";
      toast.error(`Failed to rename ${itemType}`);
      return false;
    }
  };

  const addFolder = async (newFolderName, parentId) => {
    if (!newFolderName || newFolderName.trim() === '') {
      toast.error('Folder name cannot be empty');
      return false;
    }
    try {
      const res = await axios.post('/api/folders', {
        vaultId,
        name: newFolderName.trim(),
        parentId: parentId || null
      });
      setData(res.data.data.file_tree);
      if (parentId) {
        const ancestorIds = findAllAncestorIds(res.data.data.file_tree, parentId);
        setExpandedIds(prev => new Set([...prev, parentId, ...ancestorIds]));
      }
      return true;
    } catch (e) {
      console.error("Failed to add folder:", e);
      console.error("Error details:", e.response?.data);
      toast.error('Failed to create folder');
      return false;
    }
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
              const parentId = selectedNode?.type === "folder" ? selectedNode.id : null;
              addNode("new_file.md", parentId);
            }}
          />
          <AiOutlineFolderAdd
            className="cursor-pointer hover:text-[var(--blue-9)]"
            title="Add Folder"
            onClick={() => {
              const parentId = selectedNode?.type === "folder" ? selectedNode.id : null;
              addFolder("New Folder", parentId);
            }}
          />
        </Flex>
      </Flex>
      
      {selectedFile && (
        <Box px="4" pb="2">
          <Text size="1" color="green" className="italic">
            Selected: {selectedFile.name}
          </Text>
        </Box>
      )}
      
      <Separator size="4" />

      {loading ? (
        <Box p="4">
          <Text size="2" color="gray">Loading files...</Text>
        </Box>
      ) : (
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
          selectedId={selectedNode?.id || null}
          setSelectedId={setSelectedNode}
        />
        ))
      )}
    </Box>
  );
}

export default Tree;