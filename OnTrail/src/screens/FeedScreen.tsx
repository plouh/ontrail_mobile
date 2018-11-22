import React, { Component } from 'react'
import { NavigationDrawerScreenOptions, NavigationInjectedProps } from 'react-navigation'
import { Image, Button, StyleSheet } from 'react-native'

export class FeedScreen extends Component<NavigationInjectedProps> {
    static navigationOptions: NavigationDrawerScreenOptions = {
        drawerLabel: 'Notifications',
        // drawerIcon: ({ tintColor }) => (
        // <Image
        //     source={require('./notif-icon.png')}
        //     style={[styles.icon, {tintColor: tintColor}]}
        // />
        // ),
    };

    render() {
        return (
        <Button
            onPress={() => this.props.navigation.goBack()}
            title="Go back home"
        />
        );
    }
}

const styles = StyleSheet.create({
    icon: {
        width: 24,
        height: 24,
    },
});
