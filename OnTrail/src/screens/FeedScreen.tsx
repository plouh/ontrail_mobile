import React, { Component } from 'react'
import { NavigationDrawerScreenOptions, NavigationInjectedProps } from 'react-navigation'
import { Button, StyleSheet, View, Text } from 'react-native'
import { request, HTTPMethod } from '../api/Request'
import { Either, left } from 'fp-ts/lib/Either'

export class FeedScreen extends Component<NavigationInjectedProps, { laa: Either<Error, Response> }> {
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
        this.state = { laa: left(new Error('not initialized')) }
    }

    public async componentDidMount() {
        const laa = await request('/feed').run({ method: HTTPMethod.GET, host: 'http://localhost:3000'})
        this.setState({ laa })
    }

    render() {
        return (
            <View>
                <Text>{`${this.state.laa}`}</Text>
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
