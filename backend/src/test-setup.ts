// Shared test setup. Tests import pure modules only, so no database or
// network access is needed; keep the console quiet for expected errors.
jest.spyOn(console, 'error').mockImplementation(() => undefined);
