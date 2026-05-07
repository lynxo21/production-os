import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        contactName: body.contactName || null,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        billingAddress: body.billingAddress || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(client);
  } catch (error) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await prisma.client.update({
      where: { id: body.id },
      data: {
        name: body.name,
        contactName: body.contactName || null,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        billingAddress: body.billingAddress || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(client);
  } catch (error) {
    console.error("PUT /api/clients error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clients error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}