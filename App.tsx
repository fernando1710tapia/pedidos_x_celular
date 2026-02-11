import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import LoginScreen from './src/app/Login/LoginScreen';
import NotaPedidoScreen from './src/app/NotaPedido/NotaPedidoScreen';
import { ThemeProvider } from './src/components/theme';
import { UserProvider } from './src/context/UserContext';
import { RootStackParamList } from './src/types/navigation'; // Importa los tipos
import RecuperarClaveScreen from './src/app/Login/RecuperarClaveScreen';
import { ListaNotaPedidoScreen } from './src/app/NotaPedido/ListaNotaPedidoScreen';
import MenuOperativoScreen from './src/app/MenuOperativo/MenuOperativoScreen';


const Stack = createStackNavigator<RootStackParamList>(); // ✅ Tipado del Stack

export default function App() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.light}>
        <UserProvider>
          <ThemeProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{ headerShown: false }}
              >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="RecuperarClave" component={RecuperarClaveScreen} />
                <Stack.Screen name="NotaPedido" component={NotaPedidoScreen} />
                <Stack.Screen name="ListaNotaPedido" component={ListaNotaPedidoScreen} />
                <Stack.Screen name="MenuOperativo" component={MenuOperativoScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </ThemeProvider>
        </UserProvider>
      </ApplicationProvider>
    </>
  );
}

