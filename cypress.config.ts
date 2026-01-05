import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry failed tests
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Test isolation
    testIsolation: true,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    
    // Spec pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.ts',
    
    // Videos folder
    videosFolder: 'cypress/videos',
    
    // Screenshots folder
    screenshotsFolder: 'cypress/screenshots',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
  },
});
