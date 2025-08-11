import useAxios from '@/utils/useAxios';
import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@radix-ui/react-icons';

function Home() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/vaults");
        setVaults(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch vaults:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, [axiosInstance]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-100">Your Vaults</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
          <PlusIcon width="16" height="16" />
          New Vault
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : vaults.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-lg border border-gray-800">
          <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-300">No vaults yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new vault.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <div
              key={vault.id}
              className="group relative bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-blue-500/50 transition-all duration-200"
            >
              <h3 className="text-lg font-medium text-gray-100">{vault.name}</h3>
              <p className="mt-2 text-sm text-gray-400 line-clamp-2">{vault.description || 'No description'}</p>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <span>{new Date(vault.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{vault.files_count || 0} files</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;