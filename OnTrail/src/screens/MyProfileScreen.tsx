import React, {Component} from 'react'
import { Image, Button, StyleSheet } from 'react-native'
import { NavigationInjectedProps, NavigationDrawerScreenOptions } from 'react-navigation'

export class MyProfileScreen extends Component<NavigationInjectedProps> {
    static navigationOptions: NavigationDrawerScreenOptions = {
      drawerLabel: 'Profile',
    };
  
    render() {
      return (
        <Button
          onPress={() => this.props.navigation.navigate('Feed')}
          title="Go to feed"
        />
      );
    }
  }
