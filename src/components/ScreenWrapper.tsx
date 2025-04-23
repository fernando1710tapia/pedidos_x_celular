import React from 'react';
import { SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';

const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <View style={styles.container}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7f9fc',
    },
    container: {
        flex: 1,
    },
});

export default ScreenWrapper;
