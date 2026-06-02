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
        </Stack>
    );
}
