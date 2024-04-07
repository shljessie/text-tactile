import React, { createContext, useContext, useState } from 'react';

const SelectedAssetContext = createContext();

export const useSelectedAssets = () => useContext(SelectedAssetContext);

export const SelectedAssetsProvider = ({ children }) => {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [currentPage, setCurrentPage] = useState('/'); 

  const navigateTo = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <SelectedAssetContext.Provider value={{ selectedAssets, setSelectedAssets, currentPage, navigateTo }}>
      {children}
    </SelectedAssetContext.Provider>
  );
};
