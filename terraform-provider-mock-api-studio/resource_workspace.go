package main

import (
	"context"
	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func resourceWorkspace() *schema.Resource {
	return &schema.Resource{
		CreateContext: resourceWorkspaceCreate,
		ReadContext:   resourceWorkspaceRead,
		UpdateContext: resourceWorkspaceUpdate,
		DeleteContext: resourceWorkspaceDelete,
		Schema: map[string]*schema.Schema{
			"name": {
				Type:     schema.TypeString,
				Required: true,
			},
			"slug": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"description": {
				Type:     schema.TypeString,
				Optional: true,
			},
		},
	}
}

func resourceWorkspaceCreate(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	name := d.Get("name").(string)
	slug := d.Get("slug").(string)
	description := d.Get("description").(string)

	id, err := client.CreateWorkspace(name, slug, description)
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId(id)
	return resourceWorkspaceRead(ctx, d, m)
}

func resourceWorkspaceRead(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	workspace, err := client.GetWorkspace(d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	d.Set("name", workspace["name"])
	d.Set("slug", workspace["slug"])
	d.Set("description", workspace["description"])

	return nil
}

func resourceWorkspaceUpdate(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	name := d.Get("name").(string)
	description := d.Get("description").(string)

	err := client.UpdateWorkspace(d.Id(), name, description)
	if err != nil {
		return diag.FromErr(err)
	}

	return resourceWorkspaceRead(ctx, d, m)
}

func resourceWorkspaceDelete(ctx context.Context, d *schema.ResourceData, m interface{}) diag.Diagnostics {
	client := m.(*Client)

	err := client.DeleteWorkspace(d.Id())
	if err != nil {
		return diag.FromErr(err)
	}

	d.SetId("")
	return nil
}

