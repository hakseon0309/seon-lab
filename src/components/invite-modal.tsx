"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Modal from "@/components/modal";

interface Props {
  inviteCode: string;
  onClose: () => void;
}

export default function InviteModal({ inviteCode, onClose }: Props) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(inviteCode, { width: 200, margin: 2 }).then(setQrUrl);
  }, [inviteCode]);

  return (
    <Modal title="팀 초대" onClose={onClose}>
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
            초대 코드
          </p>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-3xl font-bold tracking-[0.3em]"
              style={{ color: "var(--primary)" }}
            >
              {inviteCode}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(inviteCode)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              복사
            </button>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            팀원에게 이 코드를 알려주세요
          </p>
        </div>

        {qrUrl && (
          <div className="text-center">
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              또는 QR 코드를 보여주세요
            </p>
            <Image
              src={qrUrl}
              alt="QR code"
              width={180}
              height={180}
              unoptimized
              className="mx-auto h-[180px] w-[180px] rounded-lg"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
