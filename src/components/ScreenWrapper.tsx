import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            styles.container,
            {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
            }
        ]}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fc',
    },
    content: {
        flex: 1,
    },
});

export default ScreenWrapper;
