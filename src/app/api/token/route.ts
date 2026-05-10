import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelName = searchParams.get("channelName");

  if (!channelName) {
    return NextResponse.json({ error: "channelName is required" }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error("Agora credentials missing in .env.local");
    return NextResponse.json({ error: "Agora credentials missing" }, { status: 500 });
  }

  // Token expires in 1 hour
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      0, // uid = 0 means the SDK will assign a random one
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation failed:", error);
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
