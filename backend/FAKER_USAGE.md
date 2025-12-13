# Faker.js Templating Usage

Mock API Studio now supports **Faker.js** for generating realistic mock data dynamically.

## 📋 Quick Reference

Access the full list of available methods: `GET /faker-docs`

## 🎯 Syntax

Use the following syntax in your response bodies:

```json
{
  "name": "{{faker.person.fullName}}",
  "email": "{{faker.internet.email}}",
  "phone": "{{faker.phone.number}}"
}
```

## 📚 Available Modules

### Person
- `{{faker.person.fullName}}` - John Doe
- `{{faker.person.firstName}}` - John
- `{{faker.person.lastName}}` - Doe
- `{{faker.person.jobTitle}}` - Software Engineer

### Internet
- `{{faker.internet.email}}` - john.doe@example.com
- `{{faker.internet.userName}}` - john_doe123
- `{{faker.internet.password}}` - xK9$mP2#
- `{{faker.internet.url}}` - https://example.com
- `{{faker.internet.ip}}` - 192.168.1.1

### Address / Location
- `{{faker.address.streetAddress}}` - 123 Main Street
- `{{faker.address.city}}` - New York
- `{{faker.address.state}}` - California
- `{{faker.address.zipCode}}` - 90210
- `{{faker.address.country}}` - United States
- `{{faker.location.latitude}}` - 40.7128
- `{{faker.location.longitude}}` - -74.0060

### Company
- `{{faker.company.name}}` - Acme Corporation
- `{{faker.company.catchPhrase}}` - Innovative solutions for modern problems
- `{{faker.company.bs}}` - e-business solutions

### Commerce
- `{{faker.commerce.productName}}` - Awesome Product
- `{{faker.commerce.price}}` - 99.99
- `{{faker.commerce.department}}` - Electronics

### Finance
- `{{faker.finance.accountNumber}}` - 1234567890
- `{{faker.finance.creditCardNumber}}` - 4532-1488-0343-6467
- `{{faker.finance.bitcoinAddress}}` - 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

### Date
- `{{faker.date.past}}` - 2023-01-15T10:30:00.000Z
- `{{faker.date.future}}` - 2025-06-20T14:45:00.000Z
- `{{faker.date.recent}}` - 2024-12-10T08:15:00.000Z

### Lorem
- `{{faker.lorem.word}}` - dolor
- `{{faker.lorem.sentence}}` - Lorem ipsum dolor sit amet.
- `{{faker.lorem.paragraph}}` - Long paragraph of text...

### Datatype
- `{{faker.datatype.uuid}}` - 550e8400-e29b-41d4-a716-446655440000
- `{{faker.datatype.boolean}}` - true
- `{{faker.datatype.number}}` - 42

### Number
- `{{faker.number.int}}` - 42
- `{{faker.number.float}}` - 3.14159
- `{{faker.number.hex}}` - 0x1A2B3C

### String
- `{{faker.string.uuid}}` - 550e8400-e29b-41d4-a716-446655440000
- `{{faker.string.alphanumeric}}` - aBc123XyZ

### Image
- `{{faker.image.avatar}}` - https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/123.jpg

### Color
- `{{faker.color.human}}` - red
- `{{faker.color.rgb}}` - rgb(255, 100, 50)
- `{{faker.color.hex}}` - #FF6432

### Phone
- `{{faker.phone.number}}` - +1-555-123-4567

## 💡 Complete Example

### Request: Create User Endpoint
```json
POST /api-definitions/{apiId}/endpoints
{
  "method": "GET",
  "path": "/users/:id",
  "responses": [
    {
      "status": 200,
      "isDefault": true,
      "body": {
        "id": "{{params.id}}",
        "name": "{{faker.person.fullName}}",
        "email": "{{faker.internet.email}}",
        "phone": "{{faker.phone.number}}",
        "address": {
          "street": "{{faker.address.streetAddress}}",
          "city": "{{faker.address.city}}",
          "state": "{{faker.address.state}}",
          "zipCode": "{{faker.address.zipCode}}",
          "country": "{{faker.address.country}}"
        },
        "company": {
          "name": "{{faker.company.name}}",
          "jobTitle": "{{faker.person.jobTitle}}",
          "catchPhrase": "{{faker.company.catchPhrase}}"
        },
        "profile": {
          "username": "{{faker.internet.userName}}",
          "avatar": "{{faker.image.avatar}}",
          "bio": "{{faker.lorem.sentence}}"
        },
        "metadata": {
          "createdAt": "{{faker.date.past}}",
          "lastLogin": "{{faker.date.recent}}",
          "uuid": "{{faker.datatype.uuid}}"
        }
      }
    }
  ]
}
```

### Response: Call Mock Endpoint
```bash
GET /mock/my-api/users/123
```

**Result (each call generates different data):**
```json
{
  "id": "123",
  "name": "Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1-555-987-6543",
  "address": {
    "street": "456 Oak Avenue",
    "city": "Los Angeles",
    "state": "California",
    "zipCode": "90001",
    "country": "United States"
  },
  "company": {
    "name": "Tech Innovations Inc.",
    "jobTitle": "Senior Software Engineer",
    "catchPhrase": "Revolutionizing the digital landscape"
  },
  "profile": {
    "username": "sarah_j_2024",
    "avatar": "https://cloudflare-ipfs.com/ipfs/.../avatar/456.jpg",
    "bio": "Passionate about building scalable systems."
  },
  "metadata": {
    "createdAt": "2023-08-15T14:23:10.000Z",
    "lastLogin": "2024-12-10T09:45:30.000Z",
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

## 🔄 Dynamic Data

Every request generates **fresh, unique data**. This is perfect for:
- ✅ Testing with realistic data
- ✅ Demos and presentations
- ✅ Development without real databases
- ✅ Load testing with varied data

## 🎨 Combining with Handlebars

Faker.js works alongside existing Handlebars templating:

```json
{
  "userId": "{{params.id}}",
  "name": "{{faker.person.fullName}}",
  "searchQuery": "{{query.q}}",
  "timestamp": "{{timestamp}}",
  "email": "{{faker.internet.email}}"
}
```

## 📖 More Information

For the complete list of available methods and modules, call:

```bash
GET http://localhost:3000/faker-docs
```

Or visit the [Faker.js documentation](https://fakerjs.dev/).

