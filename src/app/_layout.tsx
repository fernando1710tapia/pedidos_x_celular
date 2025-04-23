import { Slot } from 'expo-router';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

export default function Layout() {
    return (
        <ApplicationProvider {...eva} theme={eva.light}>
            <SafeAreaView style={styles.container}>
                <StatusBar
                    barStyle="dark-content" // Puedes cambiar a "light-content" si usas fondo oscuro
                    backgroundColor="#f7f9fc"
                />
                <Slot /> {/* Este renderiza la pantalla actual */}
            </SafeAreaView>
        </ApplicationProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fc', // o el fondo global que quieras
    },
});
