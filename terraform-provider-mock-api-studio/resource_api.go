package main

import (
	"context"
	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceApi() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceApiCreate,
		ReadContext:   resourceApiRead,
		DeleteContext: resourceApiDelete,
		Schema: map[string]*schema.Schema{
			"workspace_id": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"name": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"slug": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"version": {
				Type:     schema.TypeString,
				Optional: true,
				Default:  "1.0.0",
				ForceNew: true,
			},
			"description": {
				Type:     schema.TypeString,
				Optional: true,
				ForceNew: true,
			},
		},
	}
}

func resourceApiCreate(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	workspaceId := d.Get("workspace_id").(string)
	name := d.Get("name").(string)
	slug := d.Get("slug").(string)
	version := d.Get("version").(string)
	description := d.Get("description").(string)

	id, err := client.CreateApi(workspaceId, name, slug, version, description)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(id)
	return resourceApiRead(ctx, d, m)
}

func resourceApiRead(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	api, err := client.GetApi(d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	d.Set("workspace_id", api["workspaceId"])
	d.Set("name", api["name"])
	d.Set("slug", api["slug"])
	d.Set("version", api["version"])
	d.Set("description", api["description"])

	return nil
}

func resourceApiDelete(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	err := client.DeleteApi(d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}

