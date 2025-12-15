terraform {
  required_providers {
    mock_api_studio = {
      source  = "mock-api-studio/mock-api-studio"
      version = "~> 1.0"
    }
  }
}

provider "mock_api_studio" {
  api_url   = "http://localhost:3000"
  api_token = var.api_token
}

# Create workspace
resource "mock_api_studio_workspace" "staging" {
  name        = "Staging Environment"
  slug        = "staging"
  description = "Staging workspace for testing"
}

# Create API
resource "mock_api_studio_api" "users_api" {
  workspace_id = mock_api_studio_workspace.staging.id
  name         = "Users API"
  slug         = "users-api"
  version      = "1.0.0"
  description  = "User management API"
}

# Create endpoints
resource "mock_api_studio_endpoint" "list_users" {
  api_id  = mock_api_studio_api.users_api.id
  method  = "GET"
  path    = "/users"
  summary = "List all users"
  
  response_status = 200
  response_body   = jsonencode({
    users = [
      {
        id    = "{{faker.datatype.uuid}}"
        name  = "{{faker.name.fullName}}"
        email = "{{faker.internet.email}}"
      }
    ]
  })
}

resource "mock_api_studio_endpoint" "get_user" {
  api_id  = mock_api_studio_api.users_api.id
  method  = "GET"
  path    = "/users/:id"
  summary = "Get user by ID"
  
  response_status = 200
  response_body   = jsonencode({
    id        = "{{faker.datatype.uuid}}"
    name      = "{{faker.name.fullName}}"
    email     = "{{faker.internet.email}}"
    createdAt = "{{faker.date.past}}"
  })
}

resource "mock_api_studio_endpoint" "create_user" {
  api_id  = mock_api_studio_api.users_api.id
  method  = "POST"
  path    = "/users"
  summary = "Create new user"
  
  response_status = 201
  response_body   = jsonencode({
    id      = "{{faker.datatype.uuid}}"
    message = "User created successfully"
  })
}

resource "mock_api_studio_endpoint" "update_user" {
  api_id  = mock_api_studio_api.users_api.id
  method  = "PUT"
  path    = "/users/:id"
  summary = "Update user"
  
  response_status = 200
  response_body   = jsonencode({
    message = "User updated successfully"
  })
}

resource "mock_api_studio_endpoint" "delete_user" {
  api_id  = mock_api_studio_api.users_api.id
  method  = "DELETE"
  path    = "/users/:id"
  summary = "Delete user"
  
  response_status = 204
  response_body   = ""
}

# Output values
output "api_url" {
  value = "http://localhost:3000/mock/${mock_api_studio_api.users_api.slug}"
}

output "workspace_id" {
  value = mock_api_studio_workspace.staging.id
}

