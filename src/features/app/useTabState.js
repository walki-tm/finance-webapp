import { useState } from 'react';

export default function useTabState(initialTab = 'dashboard') {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashDetail, setDashDetail] = useState(null);

  return { activeTab, setActiveTab, menuOpen, setMenuOpen, dashDetail, setDashDetail };
}