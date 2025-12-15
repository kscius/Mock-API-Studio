package main

import (
	"context"
	"flag"
	"log"

	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
	"github.com/hashicorp/terraform-plugin-sdk/v2/plugin"
)

func main() {
	var debugMode bool

	flag.BoolVar(&debugMode, "debug", false, "set to true to run the provider with support for debuggers")
	flag.Parse()

	opts := &plugin.ServeOpts{
		ProviderFunc: func() *schema.Provider {
			return Provider()
		},
	}

	if debugMode {
		opts.Debug = true
		opts.ProviderAddr = "registry.terraform.io/mock-api-studio/mock-api-studio"
	}

	plugin.Serve(opts)
}

func Provider() *schema.Provider {
	return &schema.Provider{
		Schema: map[string]*schema.Schema{
			"api_url": {
				Type:        schema.TypeString,
				Required:    true,
				DefaultFunc: schema.EnvDefaultFunc("MOCK_API_STUDIO_URL", "http://localhost:3000"),
				Description: "Mock API Studio server URL",
			},
			"api_token": {
				Type:        schema.TypeString,
				Required:    true,
				Sensitive:   true,
				DefaultFunc: schema.EnvDefaultFunc("MOCK_API_STUDIO_TOKEN", nil),
				Description: "API authentication token",
			},
		},
		ResourcesMap: map[string]*schema.Resource{
			"mock_api_studio_workspace":     resourceWorkspace(),
			"mock_api_studio_api":          resourceApi(),
			"mock_api_studio_endpoint":     resourceEndpoint(),
			"mock_api_studio_webhook":      resourceWebhook(),
		},
		DataSourcesMap: map[string]*schema.Resource{
			"mock_api_studio_workspace": dataSourceWorkspace(),
			"mock_api_studio_api":       dataSourceApi(),
		},
		ConfigureContextFunc: providerConfigure,
	}
}

func providerConfigure(ctx context.Context, d *schema.ResourceData) (interface{}, error) {
	apiUrl := d.Get("api_url").(string)
	apiToken := d.Get("api_token").(string)

	client := &Client{
		BaseURL: apiUrl,
		Token:   apiToken,
	}

	log.Printf("[INFO] Mock API Studio provider configured for: %s", apiUrl)

	return client, nil
}

