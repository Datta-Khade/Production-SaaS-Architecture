module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'migrations', 'node_modules', 'infra'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'react', 'react-hooks', 'react-refresh'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'fatal'] }],
    'react/prop-types': 'off',
    'react-hooks/set-state-in-effect': 'off',
  },
  overrides: [
    {
      files: ['client/src/**/*.tsx', 'client/src/**/*.ts'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      settings: {
        react: {
          version: 'detect'
        }
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react-hooks/set-state-in-effect': 'off',
      }
    },
    {
      files: ['server/**/*.ts', 'workers/**/*.ts'],
      rules: {
        'no-console': 'error', // Strict no-console on server
      }
    },
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off', // Scripts are allowed to use console
      }
    }
  ]
};
