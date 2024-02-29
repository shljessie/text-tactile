import React, { createContext, useContext, useState } from 'react';

const SelectedAssetContext = createContext();

export const useSelectedAssets = () => useContext(SelectedAssetContext);

export const SelectedAssetsProvider = ({ children }) => {
  const [selectedAssets, setSelectedAssets] = useState([]);

  return (
    <SelectedAssetContext.Provider value={{ selectedAssets, setSelectedAssets }}>
      {children}
    </SelectedAssetContext.Provider>
  );
};
