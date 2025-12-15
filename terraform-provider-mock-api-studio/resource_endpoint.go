package main

import (
	"context"
	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceEndpoint() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceEndpointCreate,
		ReadContext:   resourceEndpointRead,
		DeleteContext: resourceEndpointDelete,
		Schema: map[string]*schema.Schema{
			"api_id": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"method": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"path": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"summary": {
				Type:     schema.TypeString,
				Optional: true,
				ForceNew: true,
			},
			"response_status": {
				Type:     schema.TypeInt,
				Optional: true,
				Default:  200,
				ForceNew: true,
			},
			"response_body": {
				Type:     schema.TypeString,
				Optional: true,
				Default:  "{}",
				ForceNew: true,
			},
		},
	}
}

func resourceEndpointCreate(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	apiId := d.Get("api_id").(string)
	method := d.Get("method").(string)
	path := d.Get("path").(string)
	summary := d.Get("summary").(string)
	responseStatus := d.Get("response_status").(int)
	responseBody := d.Get("response_body").(string)

	responses := []map[string]interface{}{
		{
			"status":    responseStatus,
			"body":      responseBody,
			"isDefault": true,
		},
	}

	id, err := client.CreateEndpoint(apiId, method, path, summary, responses)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(id)
	return resourceEndpointRead(ctx, d, m)
}

func resourceEndpointRead(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	apiId := d.Get("api_id").(string)
	endpoint, err := client.GetEndpoint(apiId, d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	d.Set("method", endpoint["method"])
	d.Set("path", endpoint["path"])
	d.Set("summary", endpoint["summary"])

	return nil
}

func resourceEndpointDelete(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	apiId := d.Get("api_id").(string)
	err := client.DeleteEndpoint(apiId, d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}

func resourceWebhook() *schema.Resource {
	return &schema.Resource{
		CreateContext: func(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics { return nil },
		ReadContext:   func(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics { return nil },
		DeleteContext: func(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics { return nil },
		Schema: map[string]*schema.Schema{
			"workspace_id": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
		},
	}
}

func dataSourceWorkspace() *schema.Resource {
	return &schema.Resource{
		ReadContext: func(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics { return nil },
		Schema: map[string]*schema.Schema{
			"slug": {
				Type:     schema.TypeString,
				Required: true,
			},
		},
	}
}

func dataSourceApi() *schema.Resource {
	return &schema.Resource{
		ReadContext: func(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics { return nil },
		Schema: map[string]*schema.Schema{
			"slug": {
				Type:     schema.TypeString,
				Required: true,
			},
		},
	}
}

