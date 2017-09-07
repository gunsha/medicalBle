import { Navigation } from 'react-native-navigation';

import MainView from '../components/MainView';
import SideMenu from '../components/SideMenu';

// register all screens of the app (including internal ones)
export function registerScreens() {
  Navigation.registerComponent('reactBle.MainPage', () => MainView);
  Navigation.registerComponent('reactBle.SideMenu', () => SideMenu);
}