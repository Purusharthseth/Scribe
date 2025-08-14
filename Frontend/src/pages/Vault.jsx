import { useParams } from 'react-router-dom';
import '../App.css';
import EditorContainer from '../component/EditorComponent/EditorCont';
import Tree from '../component/TreeComponent/Tree';
import { Flex, Box } from '@radix-ui/themes';

function Vault() {
  const { vaultId } = useParams();
  return (
    <Flex height="100%" className="w-full overflow-hidden"> 
      <Box
        className="shrink-0 min-w-[240px] w-[240px] h-full overflow-y-auto border-r border-[var(--gray-6)] bg-[var(--gray-2)] select-none"
      >
        <Tree className="h-full" vaultId={vaultId} />
      </Box>

      <Box flexGrow="1" className="overflow-hidden min-w-0 "> 
        <EditorContainer />
      </Box>
    </Flex>
  );
}

export default Vault;
