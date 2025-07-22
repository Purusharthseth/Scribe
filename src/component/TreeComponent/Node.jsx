import React, { useState, useRef, useEffect } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { MdDeleteOutline, MdEdit } from "react-icons/md";

function Node({
  obj,
  addNode,
  deleteNode,
  editNode,
  addFolder,
  expandedIds,
  setExpandedIds,
  selectedId,
  setSelectedId,
}) {
  const [addingNode, setAddingNode] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  const isExpanded = expandedIds.has(obj.id);
  const isSelected = selectedId === obj.id;

  const toggleCollapse = () => {
    const updated = new Set(expandedIds);
    isExpanded ? updated.delete(obj.id) : updated.add(obj.id);
    setExpandedIds(updated);
  };

  const handleOutsideClick = (cb) => {
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        cb();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  };

  useEffect(() => {
    if (addingNode || addingFolder || editing) {
      return handleOutsideClick(() => {
        setAddingNode(false);
        setAddingFolder(false);
        setEditing(false);
      });
    }
  }, [addingNode, addingFolder, editing]);

  const addN = (e) => {
    e.preventDefault();
    addNode(e.target[0].value, obj.id);
    setAddingNode(false);
  };

  const addF = (e) => {
    e.preventDefault();
    addFolder(e.target[0].value, obj.id);
    setAddingFolder(false);
  };

  const del = () => deleteNode(obj.id);

  const edit = (e) => {
    e.preventDefault();
    editNode(obj.id, e.target[0].value);
    setEditing(false);
  };

  return (
    <div className="ml-2 mt-1">
      <div
        className={`group flex items-center pr-9 relative rounded px-1 py-0.5 cursor-pointer ${
          isSelected ? "bg-blue-800 text-white" : "hover:bg-slate-800"
        }`}
        onClick={() => {setSelectedId(obj.id); toggleCollapse();}}
      >
        {obj.isFolder && (
          <span
            className="text-slate-400 hover:text-blue-400 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
          >
            {isExpanded ? <FaCaretDown /> : <FaCaretUp />}
          </span>
        )}

        {editing ? (
          <form onSubmit={edit} ref={inputRef}>
            <input
              type="text"
              defaultValue={obj.name}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
              className="bg-slate-900 border border-slate-600 text-white px-2 py-1 rounded outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
          </form>
        ) : (
          <span className="truncate">{obj.name}</span>
        )}

        {/* Right-side action buttons */}
        {!editing && (
          <div className="absolute right-2 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="hover:text-yellow-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title="Rename"
            >
              <MdEdit />
            </button>
            <button
              className="hover:text-red-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                del();
              }}
              title="Delete"
            >
              <MdDeleteOutline />
            </button>
          </div>
        )}
      </div>

      {addingNode && (
        <form onSubmit={addN} className="mt-1 ml-6" ref={inputRef}>
          <input
            type="text"
            placeholder="New file name"
            onKeyDown={(e) => {
              if (e.key === "Escape") setAddingNode(false);
            }}
            className="bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded outline-none focus:ring-2 focus:ring-blue-600"
            autoFocus
          />
        </form>
      )}

      {addingFolder && (
        <form onSubmit={addF} className="mt-1 ml-6" ref={inputRef}>
          <input
            type="text"
            placeholder="New folder name"
            onKeyDown={(e) => {
              if (e.key === "Escape") setAddingFolder(false);
            }}
            className="bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded outline-none focus:ring-2 focus:ring-blue-600"
            autoFocus
          />
        </form>
      )}

      {isExpanded && obj.isFolder && (
        <div className="ml-4 mt-1">
          {obj.children.map((node) => (
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
          ))}
        </div>
      )}
    </div>
  );
}

export default Node;
