import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import '../App.css';
import EditorContainer from '../component/EditorComponent/EditorCont';
import Tree from '../component/TreeComponent/Tree';
import { Flex, Box, Spinner, Text, Button } from '@radix-ui/themes';
import useAxios from '../utils/useAxios';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import useVaultStore from '@/store/useVaultStore';
import { useTreeStore } from '@/store/useTreeStore';

function Vault() {
  const { vaultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileTree = useRef([]);
  const vaultName = useRef('');
  const axios = useAxios();
  const { userId, isLoaded } = useAuth();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('shareToken');
  useVaultStore.getState().setShareToken(shareToken);
  

  useEffect(() => {
    if (!isLoaded) return; 
    setLoading(true);
    useVaultStore.getState().reset();
    (async () => {
      try {
        const res = await axios.get(`/api/vaults/${vaultId}${shareToken ? `?shareToken=${shareToken}` : ''}`);
        fileTree.current =  res.data.data.file_tree;
        vaultName.current = res.data.data.name || '';
        console.log(res.data.data);
        const isOwner = res.data.data.owner_id === userId;
        useVaultStore.getState().setIsOwner(isOwner);
        useVaultStore.getState().setShareMode(res.data.data.share_mode || 'private');
      } catch (e) {
        console.error("Failed to fetch vault:", e);
        const errorMessage = e.response?.status === 403 
          ? "Access denied. Maybe you don't own this vault or don't have permission to view it."
          : e.response?.status === 404
          ? "Vault not found. It may have been deleted or the link is invalid."
          : "Failed to load vault. Please check your connection and try again.";
        setError(errorMessage);
        toast.error("Failed to fetch vault.");
        fileTree.current = [];
      } finally {
        setLoading(false);
      }
    })();

    return()=>{
      useVaultStore.getState().reset();
      useTreeStore.getState().resetUI();
    }
  }, [vaultId, axios, isLoaded, userId]);

  if (loading) {
    return (
      <Flex align="center" justify="center" className="h-full w-full">
        <Flex direction="column" align="center" gap="3">
          <Spinner size="3" className="text-[var(--accent-9)]" />
          <Text size="3" color="gray">Loading vault...</Text>
        </Flex>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center" className="h-full w-full">
        <Flex direction="column" align="center" gap="3" className="max-w-md text-center p-6">
          <Text size="6">⚠️</Text>
          <Text size="4" weight="medium" color="gray">Access Error</Text>
          <Text size="3" color="gray" className="leading-relaxed">
            {error}
          </Text>
          <Button 
            onClick={() => window.location.reload()} radius='small'
            className="mt-4 px-4 py-2 bg-[var(--accent-9)] text-white rounded hover:bg-[var(--accent-10)] transition-colors"
          >
            Try Again
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex className="h-full w-full overflow-hidden">
      <Box className="shrink-0 min-w-[240px] w-[240px] h-full overflow-y-auto border-r border-[var(--gray-6)] bg-[var(--gray-2)] select-none">
        <Tree className="h-full" vaultId={vaultId} fileTree={fileTree.current} />
      </Box>

      <Box flexGrow="1" className="h-full min-w-0">
        <EditorContainer vaultName={vaultName.current} />
      </Box>
    </Flex>
  );
}

export default Vault;