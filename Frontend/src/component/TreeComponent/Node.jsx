import React, { useState, useRef, useEffect } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { MdDeleteOutline, MdEdit } from "react-icons/md";
import { useTreeStore } from "@/store/useTreeStore";
import useVaultStore from "@/store/useVaultStore";

function Node({ obj }) {
  const [addingNode, setAddingNode] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  const isExpanded = useTreeStore((s) => s.expandedIds.has(obj.id));
  const selectedId = useTreeStore((s) => s.selectedId);

  const toggleExpand = useTreeStore((s) => s.toggleExpand);
  const select = useTreeStore((s) => s.select);

  const addNode = useTreeStore((s) => s.addNode);
  const addFolder = useTreeStore((s) => s.addFolder);
  const editNode = useTreeStore((s) => s.editNode);
  const deleteNode = useTreeStore((s) => s.deleteNode);

  const setSelectedFile = useVaultStore((s) => s.setSelectedFile);

  const isSelected = selectedId === obj.id;

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

  const addN = async (e) => {
    e.preventDefault();
    const ok = await addNode(e.target[0].value, obj.id);
    if (ok) setAddingNode(false);
  };

  const addF = async (e) => {
    e.preventDefault();
    const ok = await addFolder(e.target[0].value, obj.id);
    if (ok) setAddingFolder(false);
  };

  const del = () => deleteNode(obj.id, obj.type);

  const edit = async (e) => {
    e.preventDefault();
    const ok = await editNode(obj.id, e.target[0].value, obj.type);
    if (ok) setEditing(false);
  };

  return (
    <div className="ml-2 mt-1">
      <div
        className={`group flex items-center pr-9 relative rounded px-1 py-0.5 cursor-pointer ${
          isSelected ? "bg-[var(--blue-9)] text-white" : "hover:bg-[var(--gray-3)]"
        }`}
        onClick={() => {
          select(obj);
          if (obj.type === "folder") {
            toggleExpand(obj.id);
          } else {
            setSelectedFile(obj);
          }
        }}
      >
        {obj.type === "folder" && (
          <span
            className="text-[var(--gray-9)] hover:text-[var(--blue-9)] mr-1"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(obj.id);
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
              className="bg-[var(--gray-2)] border border-[var(--gray-6)] text-[var(--gray-12)] px-2 py-1 rounded outline-none focus:ring-2 focus:ring-[var(--blue-8)]"
              autoFocus
            />
          </form>
        ) : (
          <span className="truncate">{obj.name}</span>
        )}

        {!editing && (
          <div className="absolute right-2 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="hover:text-[var(--yellow-9)] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title="Rename"
            >
              <MdEdit />
            </button>
            <button
              className="hover:text-[var(--red-9)] cursor-pointer"
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
            className="bg-[var(--gray-2)] border border-[var(--gray-6)] text-[var(--gray-12)] px-2 py-1 rounded outline-none focus:ring-2 focus:ring-[var(--blue-8)]"
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
            className="bg-[var(--gray-2)] border border-[var(--gray-6)] text-[var(--gray-12)] px-2 py-1 rounded outline-none focus:ring-2 focus:ring-[var(--blue-8)]"
            autoFocus
          />
        </form>
      )}

      {isExpanded && obj.type === "folder" && (
        <div className="ml-4 mt-1">
          {obj.children && obj.children.map((node) => (
            <Node key={node.id} obj={node} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Node;