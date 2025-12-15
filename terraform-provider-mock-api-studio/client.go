package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	BaseURL string
	Token   string
	Client  *http.Client
}

func (c *Client) doRequest(method, path string, body interface{}) ([]byte, error) {
	var reqBody io.Reader

	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, fmt.Sprintf("%s%s", c.BaseURL, path), reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))

	if c.Client == nil {
		c.Client = &http.Client{}
	}

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("API request failed: %s - %s", resp.Status, string(respBody))
	}

	return respBody, nil
}

// Workspace methods
func (c *Client) CreateWorkspace(name, slug, description string) (string, error) {
	body := map[string]interface{}{
		"name":        name,
		"slug":        slug,
		"description": description,
	}

	respBody, err := c.doRequest("POST", "/admin/workspaces", body)
	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}

	return result["id"].(string), nil
}

func (c *Client) GetWorkspace(id string) (map[string]interface{}, error) {
	respBody, err := c.doRequest("GET", fmt.Sprintf("/admin/workspaces/%s", id), nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (c *Client) UpdateWorkspace(id, name, description string) error {
	body := map[string]interface{}{
		"name":        name,
		"description": description,
	}

	_, err := c.doRequest("PUT", fmt.Sprintf("/admin/workspaces/%s", id), body)
	return err
}

func (c *Client) DeleteWorkspace(id string) error {
	_, err := c.doRequest("DELETE", fmt.Sprintf("/admin/workspaces/%s", id), nil)
	return err
}

// API methods
func (c *Client) CreateApi(workspaceId, name, slug, version, description string) (string, error) {
	body := map[string]interface{}{
		"workspaceId": workspaceId,
		"name":        name,
		"slug":        slug,
		"version":     version,
		"description": description,
	}

	respBody, err := c.doRequest("POST", "/admin/api-definitions", body)
	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}

	return result["id"].(string), nil
}

func (c *Client) GetApi(id string) (map[string]interface{}, error) {
	respBody, err := c.doRequest("GET", fmt.Sprintf("/admin/api-definitions/%s", id), nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (c *Client) DeleteApi(id string) error {
	_, err := c.doRequest("DELETE", fmt.Sprintf("/admin/api-definitions/%s", id), nil)
	return err
}

// Endpoint methods
func (c *Client) CreateEndpoint(apiId, method, path, summary string, responses []map[string]interface{}) (string, error) {
	body := map[string]interface{}{
		"method":    method,
		"path":      path,
		"summary":   summary,
		"responses": responses,
		"enabled":   true,
	}

	respBody, err := c.doRequest("POST", fmt.Sprintf("/admin/api-definitions/%s/endpoints", apiId), body)
	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}

	return result["id"].(string), nil
}

func (c *Client) GetEndpoint(apiId, endpointId string) (map[string]interface{}, error) {
	respBody, err := c.doRequest("GET", fmt.Sprintf("/admin/api-definitions/%s/endpoints/%s", apiId, endpointId), nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (c *Client) DeleteEndpoint(apiId, endpointId string) error {
	_, err := c.doRequest("DELETE", fmt.Sprintf("/admin/api-definitions/%s/endpoints/%s", apiId, endpointId), nil)
	return err
}

