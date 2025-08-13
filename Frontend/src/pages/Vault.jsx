import '../App.css';
import EditorContainer from '../component/EditorComponent/EditorCont';
import Tree from '../component/TreeComponent/Tree';
import { Flex, Box } from '@radix-ui/themes';

function Vault() {
  return (
    <Flex height="100%" className="w-full overflow-hidden"> {/* prevent page horizontal scroll */}
      <Box
        /* Prefer Tailwind for consistency */
        className="shrink-0 min-w-[240px] w-[240px] h-full overflow-y-auto border-r border-[var(--gray-6)] bg-[var(--gray-2)] select-none"
      >
        <Tree className="h-full" />
      </Box>

      <Box flexGrow="1" className="overflow-hidden min-w-0 "> 
        <EditorContainer />
      </Box>
    </Flex>
  );
}

export default Vault;
