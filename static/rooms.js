class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.currentRoom = null;
        this.roomTypes = {
            COMBAT: 'combat',
            TREASURE: 'treasure',
            TRAP: 'trap',
            SANCTUARY: 'sanctuary',
            BOSS: 'boss'
        };
    }

    createRoom(id, type) {
        const room = {
            id,
            type,
            doors: [],
            contents: this.generateRoomContents(type),
            visited: false,
            cleared: false
        };
        this.rooms.set(id, room);
        return room;
    }

    generateRoomContents(type) {
        const contents = {
            monsters: [],
            treasures: [],
            traps: [],
            events: []
        };

        switch (type) {
            case this.roomTypes.COMBAT:
                contents.monsters = this.generateMonsters(1 + Math.floor(Math.random() * (2 + currentFloor)));
                if (Math.random() < 0.3) contents.treasures.push(this.generateTreasure());
                break;
            case this.roomTypes.TREASURE:
                contents.treasures = this.generateTreasures(1 + Math.floor(Math.random() * 2));
                contents.traps.push(this.generateTrap());
                break;
            case this.roomTypes.TRAP:
                contents.traps = this.generateTraps(1 + Math.floor(Math.random() * 2));
                if (Math.random() < 0.5) contents.treasures.push(this.generateTreasure());
                break;
            case this.roomTypes.SANCTUARY:
                contents.events.push({
                    type: 'heal',
                    value: 50,
                    message: 'A healing fountain restores your health.'
                });
                break;
            case this.roomTypes.BOSS:
                contents.monsters.push(this.generateBossMonster());
                contents.treasures.push(this.generateSpecialTreasure());
                break;
        }

        return contents;
    }

    generateMonsters(count) {
        const monsterTypes = [
            { type: 'Slime', health: 30, attack: 5, defense: 2 },
            { type: 'Skeleton', health: 45, attack: 8, defense: 3 },
            { type: 'Ghost', health: 35, attack: 7, defense: 1 },
            { type: 'Dark Elf', health: 55, attack: 10, defense: 4 }
        ];

        return Array(count).fill(null).map(() => {
            const base = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
            return {
                ...base,
                id: Math.random().toString(36).substr(2, 9),
                level: 1 + Math.floor(Math.random() * 3)
            };
        });
    }

    generateBossMonster() {
        const bossTypes = [
            { type: 'Dragon', health: 200, attack: 25, defense: 15 },
            { type: 'Demon Lord', health: 180, attack: 30, defense: 12 },
            { type: 'Ancient Golem', health: 250, attack: 20, defense: 20 }
        ];

        const base = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        return {
            ...base,
            id: 'boss_' + Math.random().toString(36).substr(2, 9),
            level: 5 + Math.floor(Math.random() * 3),
            isBoss: true
        };
    }

    generateTreasure() {
        const treasureTypes = [
            { type: 'gold', value: Math.floor(Math.random() * 100) + 50 },
            { type: 'health_potion', value: 50 },
            { type: 'mana_potion', value: 30 },
            { type: 'equipment', item: this.generateEquipment() }
        ];

        return treasureTypes[Math.floor(Math.random() * treasureTypes.length)];
    }

    generateSpecialTreasure() {
        const specialTreasures = [
            { type: 'legendary_equipment', item: this.generateLegendaryEquipment() },
            { type: 'special_key', value: 'Opens a special door' },
            { type: 'artifact', value: 'Ancient powerful artifact' }
        ];

        return specialTreasures[Math.floor(Math.random() * specialTreasures.length)];
    }

    generateTrap() {
        const trapTypes = [
            { type: 'spike', damage: 20, message: 'Sharp spikes spring from the floor!' },
            { type: 'poison', damage: 5, duration: 3, message: 'Poisonous gas fills the air!' },
            { type: 'curse', effect: 'weakness', duration: 2, message: 'A dark curse weakens you!' }
        ];

        return trapTypes[Math.floor(Math.random() * trapTypes.length)];
    }

    generateEquipment() {
        const equipment = [
            { type: 'weapon', name: 'Steel Sword', attack: 5 },
            { type: 'armor', name: 'Chain Mail', defense: 3 },
            { type: 'accessory', name: 'Ring of Protection', defense: 1, health: 10 }
        ];

        return equipment[Math.floor(Math.random() * equipment.length)];
    }

    generateLegendaryEquipment() {
        const legendaryEquipment = [
            { type: 'weapon', name: 'Dragonslayer', attack: 15, special: 'Dragon Damage +50%' },
            { type: 'armor', name: 'Divine Plate', defense: 10, special: 'Auto-heal 1%/s' },
            { type: 'accessory', name: 'Ancient Crown', magic: 5, special: 'Mana cost -20%' }
        ];

        return legendaryEquipment[Math.floor(Math.random() * legendaryEquipment.length)];
    }

    connectRooms(room1Id, room2Id, direction) {
        const room1 = this.rooms.get(room1Id);
        const room2 = this.rooms.get(room2Id);

        if (!room1 || !room2) return false;

        const oppositeDirection = {
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east'
        };

        room1.doors.push({ direction, targetRoomId: room2Id });
        room2.doors.push({ direction: oppositeDirection[direction], targetRoomId: room1Id });

        return true;
    }

    enterRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        if (!room.visited) {
            room.visited = true;
            // First time entering the room
            return {
                type: 'new_room',
                room: room
            };
        }

        // Returning to a previously visited room
        return {
            type: 'return_room',
            room: room
        };
    }

    generateDungeon(size = 9) {
        // Clear existing rooms
        this.rooms.clear();

        // Create starting room (sanctuary)
        const startRoom = this.createRoom('start', this.roomTypes.SANCTUARY);
        this.currentRoom = startRoom;

        // Create a grid of rooms
        const gridSize = Math.sqrt(size);
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
        const center = Math.floor(gridSize / 2);
        grid[center][center] = startRoom;

        // Generate other rooms
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (i === center && j === center) continue;

                const roomId = `room_${i}_${j}`;
                const roomType = this.getRandomRoomType();
                const room = this.createRoom(roomId, roomType);
                grid[i][j] = room;

                // Connect with adjacent rooms
                if (i > 0) this.connectRooms(roomId, `room_${i-1}_${j}`, 'north');
                if (j > 0) this.connectRooms(roomId, `room_${i}_${j-1}`, 'west');
            }
        }

        // Add boss room at the furthest corner
        const bossRoom = this.createRoom('boss', this.roomTypes.BOSS);
        this.connectRooms('room_${gridSize-1}_${gridSize-1}', 'boss', 'east');

        return startRoom;
    }

    getRandomRoomType() {
        const weights = {
            [this.roomTypes.COMBAT]: 0.4,
            [this.roomTypes.TREASURE]: 0.2,
            [this.roomTypes.TRAP]: 0.2,
            [this.roomTypes.SANCTUARY]: 0.1
        };

        const rand = Math.random();
        let sum = 0;
        for (const [type, weight] of Object.entries(weights)) {
            sum += weight;
            if (rand <= sum) return type;
        }
        return this.roomTypes.COMBAT;
    }
} 