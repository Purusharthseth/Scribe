import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import '../App.css';
import EditorContainer from '../component/EditorComponent/EditorCont';
import Tree from '../component/TreeComponent/Tree';
import { Flex, Box, Spinner, Text } from '@radix-ui/themes';
import useAxios from '../utils/useAxios';

function Vault() {
  const { vaultId } = useParams();
  const [loading, setLoading] = useState(true);
  const fileTree = useRef([]);
  const vaultName = useRef('');
  const axios = useAxios();

  useEffect(() => {
    if (!vaultId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await axios.get(`/api/vaults/${vaultId}`);
        fileTree.current = Array.isArray(res.data.data.file_tree) ? res.data.data.file_tree : [];
        vaultName.current = res.data.data.name || '';
        console.log(res.data.data);
      } catch (e) {
        console.error("Failed to fetch vault tree:", e);
        fileTree.current = [];
      } finally {
        setLoading(false);
      }
    })();
  }, [vaultId, axios]);

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