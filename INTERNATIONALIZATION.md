# Internationalization (i18n)

## Current Status: English Only ✅

The entire codebase is in English for open-source accessibility:

### Code
- ✅ All variable names in English
- ✅ All function names in English
- ✅ All comments in English
- ✅ All types/interfaces in English

### Documentation
- ✅ README.md in English
- ✅ All .md files in English
- ✅ Code comments in English
- ✅ Commit messages in English

### UI
- ✅ All button labels in English
- ✅ All form labels in English
- ✅ All error messages in English
- ✅ All navigation links in English

## Future i18n Support

To add multi-language support in the future:

### Frontend
```bash
npm install react-i18next i18next
```

Create `frontend/src/i18n/locales/`:
- `en.json` - English (default)
- `es.json` - Spanish
- `pt.json` - Portuguese
- etc.

### Backend
```bash
npm install i18n
```

Configure in `backend/src/config/i18n.config.ts`

## Language Files Structure

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "dashboard": {
    "title": "Mock APIs",
    "createButton": "Create API"
  },
  "errors": {
    "notFound": "Not found",
    "serverError": "Server error"
  }
}
```

## Best Practices

1. **Never hardcode strings** in components
2. **Use translation keys** like `t('common.save')`
3. **Keep keys organized** by feature/page
4. **Provide fallbacks** for missing translations
5. **Test with all supported languages**

## Translation Guidelines

- Keep strings concise and clear
- Avoid idioms that don't translate well
- Use placeholders for dynamic values: `"Hello {{name}}"`
- Maintain consistent terminology across the app
- Consider plural forms and gender in translations

