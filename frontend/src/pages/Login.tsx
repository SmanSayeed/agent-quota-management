import { Container, Title, Paper, Text } from '@mantine/core';

export default function LoginPage() {
  return (
    <Container size="xs" py={80}>
      <Paper shadow="md" p="xl" radius="md">
        <Title order={2} mb="md">Login</Title>
        <Text c="dimmed">Login page - To be implemented</Text>
      </Paper>
    </Container>
  );
}
