import { useState, useEffect, useCallback } from "react";
import Node from "./Node";
import { AiFillFileAdd, AiOutlineFolderAdd } from "react-icons/ai";
import { Box, Flex, Text } from '@radix-ui/themes';
import useAxios from '@/utils/useAxios';
import useVaultStore from '@/store/useVaultStore';
import toast from 'react-hot-toast';
import { useTreeStore } from '@/store/useTreeStore';

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
  if (!dfs(data)) console.log("Node not found.");
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

function Tree({ vaultId, fileTree }) {
  const [data, setData] = useState(fileTree);
  const axios = useAxios();
  const selectedFile = useVaultStore((s) => s.selectedFile);
  const setSelectedFile = useVaultStore((s) => s.setSelectedFile);
  const isOwner = useVaultStore((s) => s.isOwner);
  const shareMode = useVaultStore((s) => s.shareMode);
  const shareToken = useVaultStore((s) => s.shareToken);
  const expandMany = useTreeStore((s) => s.expandMany);
  const initStore = useTreeStore((s) => s.init);

  const canEdit = isOwner || shareMode === 'edit';
  const shareTokenParam = (!isOwner && shareToken) ? `?shareToken=${shareToken}` : '';

  const sanitizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.trim().replace(/[<>:"\/\\|?*\x00-\x1f]/g, '').substring(0, 255);
  };

  const addNode = useCallback(async (newNodeName, parentId) => {
    const sanitizedName = sanitizeName(newNodeName);
    if (!sanitizedName) {
      toast.error('File name cannot be empty or contain invalid characters');
      return false;
    }
    try {
      const res = await axios.post(`/api/files${shareTokenParam}`, {
        vaultId,
        name: sanitizedName,
        content: '',
        folderId: parentId || null,
      });
      const newTree = res.data?.data?.file_tree || [];
      setData(newTree);

      if (parentId) {
        const ancestorIds = findAllAncestorIds(newTree, parentId);
        expandMany([parentId, ...ancestorIds]);
      }
      return true;
    } catch (e) {
      console.error("Failed to add file:", e);
      console.error("Error details:", e.response?.data);
      toast.error('Failed to create file');
      return false;
    }
  }, [axios, vaultId, shareTokenParam]);

  // ---- addFolder ----
  const addFolder = useCallback(async (newFolderName, parentId) => {
    const sanitizedName = sanitizeName(newFolderName);
    if (!sanitizedName) {
      toast.error('Folder name cannot be empty or contain invalid characters');
      return false;
    }
    try {
      const res = await axios.post(`/api/folders${shareTokenParam}`, {
        vaultId,
        name: sanitizedName,
        parentId: parentId || null,
      });
      const newTree = res.data?.data?.file_tree || [];
      setData(newTree);

      if (parentId) {
        const ancestorIds = findAllAncestorIds(newTree, parentId);
        expandMany([parentId, ...ancestorIds]);
      }
      return true;
    } catch (e) {
      console.error("Failed to add folder:", e);
      console.error("Error details:", e.response?.data);
      toast.error('Failed to create folder');
      return false;
    }
  }, [axios, vaultId, shareTokenParam]);

  // ---- editNode ----
  const editNode = useCallback(async (nodeId, newName, nodeType) => {
    const sanitizedName = sanitizeName(newName);
    if (!sanitizedName) {
      const itemType = nodeType === "folder" ? "Folder" : "File";
      toast.error(`${itemType} name cannot be empty or contain invalid characters`);
      return false;
    }
    try {
      let res;
      if (nodeType === "folder") {
        res = await axios.put(`/api/folders/${nodeId}/name${shareTokenParam}`, {
          vaultId,
          newName: sanitizedName,
        });
      } else {
        res = await axios.put(`/api/files/${nodeId}/name${shareTokenParam}`, {
          vaultId,
          newName: sanitizedName,
        });
      }
      const newTree = res.data?.data?.file_tree || [];
      setData(newTree);
      return true;
    } catch (e) {
      console.error("Failed to edit node:", e);
      console.error("Error details:", e.response?.data);
      const itemType = nodeType === "folder" ? "folder" : "file";
      toast.error(`Failed to rename ${itemType}`);
      return false;
    }
  }, [axios, vaultId, shareTokenParam]);

  // ---- deleteNode ----
  const deleteNode = useCallback(async (nodeId, nodeType) => {
    const currentData = data;

    const shouldClearSelectedFile =
      selectedFile &&
      ((nodeType === "file" && selectedFile.id === nodeId) ||
       (nodeType === "folder" && isFileInsideFolder(currentData, selectedFile.id, nodeId)));

    try {
      let res;
      if (nodeType === "folder") {
        res = await axios.delete(`/api/folders/${nodeId}${shareTokenParam}`, { data: { vaultId } });
      } else {
        res = await axios.delete(`/api/files/${nodeId}${shareTokenParam}`, { data: { vaultId } });
      }
      const newTree = res.data?.data?.file_tree || [];
      setData(newTree);

      if (shouldClearSelectedFile) {
        setSelectedFile(null);
        const selectedId = useTreeStore.getState().selectedId;
        if (selectedId === nodeId) useTreeStore.getState().select(null);
      }
    } catch (e) {
      toast.error(`Failed to delete ${nodeType}`);
      console.error("Failed to delete node:", e);
      console.error("Error details:", e.response?.data);
    }
  }, [axios, vaultId, data, selectedFile, setSelectedFile, shareTokenParam]);

  useEffect(() => {
    initStore({ addNode, addFolder, editNode, deleteNode });
  }, [initStore, addNode, addFolder, editNode, deleteNode]);

  return (
    <Box pt="3" className="text-sm font-medium text-[var(--gray-11)]">
      <Flex gap="3" justify="between" px="4" pb="1" align="center">
        <Text size="2" weight="medium" className="text-[var(--blue-11)]">FILE TREE</Text>
        {canEdit && (
          <Flex gap="3">
            <AiFillFileAdd
              className="cursor-pointer hover:text-[var(--blue-9)]"
              title="Add File"
              onClick={() => {
                const selectedId = useTreeStore.getState().selectedId;
                const parentId = (() => {
                  if (!selectedId) return null;
                  const temp = [...data];
                  while (temp.length) {
                    const n = temp.pop();
                    if (n.id === selectedId) return n.type === 'folder' ? n.id : null;
                    if (n.type === 'folder' && n.children) temp.push(...n.children);
                  }
                  return null;
                })();
                addNode("new_file.md", parentId);
              }}
            />
            <AiOutlineFolderAdd
              className="cursor-pointer hover:text-[var(--blue-9)]"
              title="Add Folder"
              onClick={() => {
                const selectedId = useTreeStore.getState().selectedId;
                const parentId = (() => {
                  if (!selectedId) return null;
                  const temp = [...data];
                  while (temp.length) {
                    const n = temp.pop();
                    if (n.id === selectedId) return n.type === 'folder' ? n.id : null;
                    if (n.type === 'folder' && n.children) temp.push(...n.children);
                  }
                  return null;
                })();
                addFolder("New Folder", parentId);
              }}
            />
          </Flex>
        )}
      </Flex>

      {data.map((node) => (
        <Node key={node.id} obj={node} />
      ))}
    </Box>
  );
}

export default Tree;