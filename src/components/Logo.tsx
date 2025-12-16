'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
    return (
        <Link
            href="/"
            className="-m-1.5 p-1.5 flex items-center group"
        >
            <div
                className="relative h-14 w-14 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110"
            >
                <Image
                    src="/MMlogo.png"
                    alt="MessyMind"
                    width={56}
                    height={56}
                    className="object-contain"
                    priority
                />
            </div>
        </Link>
    );
}
