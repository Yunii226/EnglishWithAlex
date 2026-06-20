import { Stack } from "expo-router";

export default function GamesLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="quiz"
                options={{
                    title: "Quiz",
                    headerShown: true,
                    headerBackTitle: "Arcade"
                }}
            />
            <Stack.Screen
                name="listening"
                options={{
                    title: "Listening",
                    headerShown: true,
                    headerBackTitle: "Arcade"
                }}
            />
            <Stack.Screen
                name="spelling"
                options={{
                    title: "Escribe",
                    headerShown: true,
                    headerBackTitle: "Arcade"
                }}
            />
            <Stack.Screen
                name="memory"
                options={{
                    title: "Parejas",
                    headerShown: true,
                    headerBackTitle: "Arcade"
                }}
            />
            <Stack.Screen
                name="scramble"
                options={{
                    title: "Anagrama",
                    headerShown: true,
                    headerBackTitle: "Arcade"
                }}
            />
        </Stack>
    );
}
