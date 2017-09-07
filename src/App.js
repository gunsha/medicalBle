import { Navigation } from 'react-native-navigation';

import { registerScreens } from './screens';

registerScreens(); // this is where you register all of your app's screens

// start the app
Navigation.startSingleScreenApp({
  screen: 
    {
      label: 'One',
      screen: 'reactBle.MainPage', // this is a registered name for a screen
      title: 'Screen One'
    },
    drawer: { // optional, add this if you want a side menu drawer in your app
      right: { // optional, define if you want a drawer from the right
        screen: 'reactBle.SideMenu', // unique ID registered with Navigation.registerScreen
        passProps: {} // simple serializable object that will pass as props to all top screens (optional)
      },
      style: { // ( iOS only )
        drawerShadow: true, // optional, add this if you want a side menu drawer shadow
        contentOverlayColor: 'rgba(0,0,0,0.25)', // optional, add this if you want a overlay color when drawer is open
        leftDrawerWidth: 50, // optional, add this if you want a define left drawer width (50=percent)
        rightDrawerWidth: 50 // optional, add this if you want a define right drawer width (50=percent)
      },
      type: 'MMDrawer',
      disableOpenGesture: false // optional, can the drawer be opened with a swipe instead of button
    },
    passProps: {}, // simple serializable object that will pass as props to all top screens (optional)
    animationType: 'slide-down'
});