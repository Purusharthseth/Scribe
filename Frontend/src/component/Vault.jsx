// App.jsx
import '../App.css';
import EditorContainer from './EditorComponent/EditorCont';
import Tree from './TreeComponent/Tree';

function Vault() {
  return (
    <div className="flex h-full">
      <div className="w-60 h-full overflow-y-auto border-r select-none" style={{ background: "#18181b" }}>
        <Tree />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EditorContainer />
      </div>
    </div>
  );
}

export default Vault;
