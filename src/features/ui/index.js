/**
 * 📄 UI FEATURES EXPORT: Re-export dei componenti UI per compatibilità
 * 
 * 🎯 Scopo: Mantiene compatibilità con imports esistenti
 * 
 * 📝 Note:
 * - I componenti sono ora in /components/ui/
 * - Questo file assicura che gli import esistenti continuino a funzionare
 * 
 * @author Finance WebApp Team
 * @modified 19 Gennaio 2025 - Aggiornato per nuova struttura UI
 */

// 🔸 Re-export da nuova struttura components/ui
export {
  cx,
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  Switch,
  NativeSelect,
  NavItem
} from '../../components/ui'
