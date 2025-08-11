
import '../App.css';
import EditorContainer from '../component/EditorComponent/EditorCont';
import Tree from '../component/TreeComponent/Tree';
import { Flex, Box } from '@radix-ui/themes';

function Vault() {
  return (
    <Flex height="100%">
      <Box 
        width="240px" 
        height="100%" 
        className="overflow-y-auto border-r border-[var(--gray-6)] bg-[var(--gray-2)] select-none"
      >
        <Tree />
      </Box>
      
      <Box flexGrow="1" className="overflow-hidden">
        <EditorContainer />
      </Box>
    </Flex>
  );
}

export default Vault;
