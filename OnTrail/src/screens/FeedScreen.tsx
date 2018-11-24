import React, { Component } from 'react'
import { NavigationDrawerScreenOptions, NavigationInjectedProps } from 'react-navigation'
import { Button, StyleSheet, View, Text } from 'react-native'
import { request, HTTPMethod } from '../api/Request'
import { Either, left } from 'fp-ts/lib/Either'
import { authGet, loginRequest } from '../api/Methods';
import { ILogin } from '../model/Login';

export class FeedScreen extends Component<NavigationInjectedProps, { lii: Either<Error, ILogin>, laa: Either<Error, Response> }> {
    static navigationOptions: NavigationDrawerScreenOptions = {
        drawerLabel: 'Feed',
        // drawerIcon: ({ tintColor }) => (
        // <Image
        //     source={require('./notif-icon.png')}
        //     style={[styles.icon, {tintColor: tintColor}]}
        // />
        // ),
    };

    constructor(props: NavigationInjectedProps) {
        super(props)
        this.state = { lii: left(new Error('not initialized')), laa: left(new Error('not initialized')) }
    }

    public async componentDidMount() {
        const lii = await loginRequest({ 'email': 'psalmi+1@iki.fi', 'pass': 'laakuikka' }).run({ host: 'http://192.168.1.107:3000' })
        console.log('le lii')
        const laa = await authGet('/feed').run({ host: 'http://192.168.1.107:3000' })
        console.log('le laa')
        this.setState({ lii, laa })
    }

    render() {
        return (
            <View>
                <Text>Otsikko</Text>
                <Text>Kotsikko</Text>
                <Text>{`${this.state.laa}`}</Text>
                <Text>{`${this.state.lii}`}</Text>
                <Button
                    onPress={() => this.props.navigation.goBack()}
                    title="Go back to profile"
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    icon: {
        width: 24,
        height: 24,
    },      
});
