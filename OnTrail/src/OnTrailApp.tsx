import React from 'react'

//@ts-ignore
import { createDrawerNavigator, createAppContainer } from "react-navigation"
import { MyProfileScreen } from './screens/MyProfileScreen'
import { FeedScreen } from './screens/FeedScreen'

const OnTrailDrawerNavigator = createDrawerNavigator({
    Feed: FeedScreen,
    Home: MyProfileScreen,
});

export const OnTrailApp = createAppContainer(OnTrailDrawerNavigator);