// App.jsx
import './App.css';
import Tree from './component/TreeComponent/Tree';
import EditorCont from './EditorCont';

function App() {
  return (
    <div className="flex h-screen">
      {/* File Tree Sidebar - Fixed width and scrollable */}
      <div className="w-60 h-full overflow-y-auto border-r select-none" style={{ background: "#18181b" }}>
        <Tree />
      </div>
      
      {/* Editor Area - Flexible width */}
      <div className="flex-1 overflow-hidden">
        <EditorCont />
      </div>
    </div>
  );
}

export default App;
